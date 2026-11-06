import httpx
import asyncio
from config import settings
from database import SessionLocal
from models import User, Item, Claim, ItemReturn, Category

BASE_URL = 'http://localhost:8000/api/v1'

class AdminQAClient:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL)
        self.tokens = {}
        self.ids = {}

    async def get_headers(self, persona):
        return {'Authorization': f"Bearer {self.tokens[persona]}"}

    def clear_test_data(self):
        print('Clearing test data...')
        db = SessionLocal()
        db.query(ItemReturn).delete()
        db.query(Claim).delete()
        db.query(Item).delete()
        db.query(Category).delete()
        emails = ['beta@findora.com', 'user_a@findora.com', 'user_b@findora.com', 'gamma@findora.com']
        db.query(User).filter(User.email.in_(emails)).delete()
        db.commit()
        db.close()

    async def setup_personas(self):
        self.clear_test_data()
        print('\n--- Setting up Personas ---')
        login_data = {'email': settings.ADMIN_EMAIL, 'password': settings.ADMIN_PASSWORD}
        resp = await self.client.post('/auth/login', json=login_data)
        if resp.status_code != 200:
            raise Exception(f'Failed to login as default admin: {resp.text}')
        self.tokens['admin_alpha'] = resp.json()['access_token']
        print('Admin Alpha logged in.')

        admin_beta_data = {
            'full_name': 'Admin Beta',
            'email': 'beta@findora.com',
            'password': 'Password123',
            'role': 'admin'
        }
        headers = await self.get_headers('admin_alpha')
        resp = await self.client.post('/admin/users', json=admin_beta_data, headers=headers)
        if resp.status_code != 201:
            raise Exception(f'Failed to create Admin Beta: {resp.text}')
        self.ids['admin_beta'] = resp.json()['id']

        login_beta = {'email': 'beta@findora.com', 'password': 'Password123'}
        resp = await self.client.post('/auth/login', json=login_beta)
        self.tokens['admin_beta'] = resp.json()['access_token']
        print('Admin Beta created and logged in.')

        user_a_data = {
            'full_name': 'User A',
            'email': 'user_a@findora.com',
            'password': 'Password123'
        }
        resp = await self.client.post('/auth/register', json=user_a_data)
        if resp.status_code != 201:
            raise Exception(f'Failed to create User A: {resp.text}')
        self.ids['user_a'] = resp.json()['id']

        login_a = {'email': 'user_a@findora.com', 'password': 'Password123'}
        resp = await self.client.post('/auth/login', json=login_a)
        self.tokens['user_a'] = resp.json()['access_token']
        print('User A created and logged in.')

        user_b_data = {
            'full_name': 'User B',
            'email': 'user_b@findora.com',
            'password': 'Password123'
        }
        resp = await self.client.post('/auth/register', json=user_b_data)
        self.ids['user_b'] = resp.json()['id']
        print('User B created.')

        cat_data = {'name': 'QA Category', 'description': 'For testing'}
        resp = await self.client.post('/categories', json=cat_data, headers=headers)
        self.ids['cat_active'] = resp.json()['id']

        cat_inactive_data = {'name': 'Inactive Cat', 'description': 'Inactive'}
        resp = await self.client.post('/categories', json=cat_inactive_data, headers=headers)
        cat_id = resp.json()['id']
        await self.client.patch(f'/categories/{cat_id}', json={'is_active': False}, headers=headers)
        self.ids['cat_inactive'] = cat_id

        item_data = {
            'title': 'QA Found Item',
            'description': 'This item is for QA testing purposes',
            'item_type': 'found',
            'location': 'QA Lab',
            'event_date': '2026-10-01T10:00:00Z',
            'category_id': self.ids['cat_active']
        }
        user_a_headers = await self.get_headers('user_a')
        resp = await self.client.post('/items', json=item_data, headers=user_a_headers)
        self.ids['item_open'] = resp.json()['id']

        item_closed_data = item_data.copy()
        item_closed_data['title'] = 'QA Closed Item'
        resp = await self.client.post('/items', json=item_closed_data, headers=user_a_headers)
        item_id = resp.json()['id']
        await self.client.patch(f'/items/{item_id}/close', headers=user_a_headers)
        self.ids['item_closed'] = item_id

        item_ret_data = item_data.copy()
        item_ret_data['title'] = 'QA Returned Item'
        resp = await self.client.post('/items', json=item_ret_data, headers=user_a_headers)
        item_id_ret = resp.json()['id']

        login_b = {'email': 'user_b@findora.com', 'password': 'Password123'}
        resp = await self.client.post('/auth/login', json=login_b)
        token_b = resp.json()['access_token']

        claim_data = {'ownership_proof': 'I have the receipt for this item.'}
        resp = await self.client.post(f'/items/{item_id_ret}/claims', json=claim_data, headers={'Authorization': f'Bearer {token_b}'})
        claim_id = resp.json()['id']

        review_data = {'status': 'approved', 'review_note': 'Looks good'}
        await self.client.patch(f'/claims/{claim_id}/review', json=review_data, headers=headers)
        await self.client.post(f'/claims/{claim_id}/return', headers=headers)
        self.ids['item_returned'] = item_id_ret

        item_claims_data = item_data.copy()
        item_claims_data['title'] = 'Item With Claims'
        resp = await self.client.post('/items', json=item_claims_data, headers=user_a_headers)
        item_id_claims = resp.json()['id']
        await self.client.post(f'/items/{item_id_claims}/claims', json=claim_data, headers={'Authorization': f'Bearer {token_b}'})
        self.ids['item_with_claims'] = item_id_claims

        print('Environment setup complete.')

    async def test_security(self):
        print('\n--- Security Phase ---')
        endpoints = [
            ('/admin/dashboard', 'GET'),
            ('/admin/users', 'GET'),
            (f'/admin/users/{self.ids["user_a"]}', 'GET'),
            (f'/admin/users/{self.ids["user_a"]}/status', 'PATCH'),
            (f'/admin/users/{self.ids["user_a"]}/role', 'PATCH'),
            ('/admin/categories', 'GET'),
            (f'/admin/items/{self.ids["item_open"]}/status', 'PATCH'),
            (f'/admin/items/{self.ids["item_open"]}', 'DELETE'),
        ]

        for ep, method in endpoints:
            if method == 'GET': r = await self.client.get(ep)
            elif method == 'PATCH': r = await self.client.patch(ep, json={})
            else: r = await self.client.delete(ep)
            print(f'No Token | {ep} | {r.status_code} | {"PASS" if r.status_code == 401 else "FAIL"}')

            headers = await self.get_headers('user_a')
            if method == 'GET': r = await self.client.get(ep, headers=headers)
            elif method == 'PATCH': r = await self.client.patch(ep, json={}, headers=headers)
            else: r = await self.client.delete(ep, headers=headers)
            print(f'Non-Admin | {ep} | {r.status_code} | {"PASS" if r.status_code == 403 else "FAIL"}')

    async def test_user_management(self):
        print('\n--- User Management Phase ---')
        headers = await self.get_headers('admin_alpha')
        data = {'full_name': 'Admin Gamma', 'email': 'gamma@findora.com', 'password': 'Password123', 'role': 'admin'}
        resp = await self.client.post('/admin/users', json=data, headers=headers)
        print(f'Create Admin | {resp.status_code} | {"PASS" if resp.status_code == 201 else "FAIL"}')

        resp = await self.client.get('/admin/users?role=admin', headers=headers)
        print(f'Filter Users (Admin) | {resp.status_code} | {"PASS" if resp.status_code == 200 else "FAIL"}')

        resp = await self.client.patch(f'/admin/users/{self.ids["user_b"]}/status', json={'is_active': False}, headers=headers)
        print(f'Update Status (Inactive) | {resp.status_code} | {"PASS" if resp.status_code == 200 else "FAIL"}')

        resp = await self.client.patch(f'/admin/users/{self.ids["user_a"]}/role', json={'role': 'admin'}, headers=headers)
        print(f'Update Role (To Admin) | {resp.status_code} | {"PASS" if resp.status_code == 200 else "FAIL"}')

        login_a = {'email': 'user_a@findora.com', 'password': 'Password123'}
        resp = await self.client.post('/auth/login', json=login_a)
        self.tokens['user_a'] = resp.json()['access_token']

    async def test_last_admin_protection(self):
        print('\n--- Last Active Admin Protection Phase ---')
        headers = await self.get_headers('admin_alpha')
        await self.client.patch(f'/admin/users/{self.ids["admin_beta"]}/role', json={'role': 'user'}, headers=headers)
        await self.client.patch(f'/admin/users/{self.ids["user_a"]}/role', json={'role': 'user'}, headers=headers)

        me_resp = await self.client.get('/auth/me', headers=headers)
        alpha_id = me_resp.json()['id']

        resp = await self.client.patch(f'/admin/users/{alpha_id}/status', json={'is_active': False}, headers=headers)
        print(f'Deactivate Last Admin | {resp.status_code} | {"PASS" if resp.status_code == 409 else "FAIL"}')

        resp = await self.client.patch(f'/admin/users/{alpha_id}/role', json={'role': 'user'}, headers=headers)
        print(f'Demote Last Admin | {resp.status_code} | {"PASS" if resp.status_code == 409 else "FAIL"}')

        resp = await self.client.delete(f'/admin/users/{alpha_id}', headers=headers)
        print(f'Delete Last Admin | {resp.status_code} | {"PASS" if resp.status_code == 409 else "FAIL"}')

    async def test_moderation(self):
        print('\n--- Moderation Phase ---')
        headers = await self.get_headers('admin_alpha')
        resp = await self.client.patch(f'/admin/items/{self.ids["item_open"]}/status', json={'status': 'closed'}, headers=headers)
        print(f'Moderation Open->Closed | {resp.status_code} | {"PASS" if resp.status_code == 200 else "FAIL"}')

        resp = await self.client.patch(f'/admin/items/{self.ids["item_closed"]}/status', json={'status': 'open'}, headers=headers)
        print(f'Moderation Closed->Open | {resp.status_code} | {"PASS" if resp.status_code == 200 else "FAIL"}')

        resp = await self.client.patch(f'/admin/items/{self.ids["item_returned"]}/status', json={'status': 'open'}, headers=headers)
        print(f'Modify Returned Item | {resp.status_code} | {"PASS" if resp.status_code == 409 or resp.status_code == 403 else "FAIL"}')

    async def test_deletion(self):
        print('\n--- Deletion Phase ---')
        headers = await self.get_headers('admin_alpha')
        resp = await self.client.delete(f'/admin/items/{self.ids["item_with_claims"]}', headers=headers)
        print(f'Delete Item with Claims | {resp.status_code} | {"PASS" if resp.status_code == 409 else "FAIL"}')

        resp = await self.client.delete(f'/admin/items/{self.ids["item_open"]}', headers=headers)
        print(f'Delete Item without Claims | {resp.status_code} | {"PASS" if resp.status_code == 204 else "FAIL"}')

    async def test_dashboard(self):
        print('\n--- Dashboard Phase ---')
        headers = await self.get_headers('admin_alpha')
        resp = await self.client.get('/admin/dashboard', headers=headers)
        if resp.status_code == 200:
            print(f'Dashboard API | {resp.status_code} | PASS')
        else:
            print(f'Dashboard API | {resp.status_code} | FAIL')

    async def run(self):
        try:
            await self.setup_personas()
            await self.test_security()
            await self.test_user_management()
            await self.test_last_admin_protection()
            await self.test_moderation()
            await self.test_deletion()
            await self.test_dashboard()
        finally:
            await self.client.aclose()

if __name__ == '__main__':
    asyncio.run(AdminQAClient().run())
