import os
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Category, Item, ItemType, ItemStatus, UserRole
from utils import security
from config import settings
from datetime import datetime, timezone


def seed_database():
    db = SessionLocal()
    try:
        print("Starting database seeding...")

        # 1. Create Admin User
        admin_email = settings.ADMIN_EMAIL
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print(f"Creating admin user: {admin_email}")
            admin = User(
                id=uuid.uuid4(),
                full_name=settings.ADMIN_FULL_NAME,
                email=admin_email,
                password_hash=security.hash_password(settings.ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
            db.add(admin)
        else:
            print("Admin user already exists.")

        # 2. Create Demo User
        demo_email = settings.DEMO_USER_EMAIL
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            print(f"Creating demo user: {demo_email}")
            demo_user = User(
                id=uuid.uuid4(),
                full_name="Demo User",
                email=demo_email,
                password_hash=security.hash_password(settings.DEMO_USER_PASSWORD),
                role="user",
                is_active=True
            )
            db.add(demo_user)
        else:
            print("Demo user already exists.")




        db.commit()

        # 3. Create Starter Categories
        categories_list = [
            "Electronics", "Documents", "Wallets & Bags",
            "Keys", "Clothing", "Pets", "Jewelry", "Other"
        ]
        category_map = {}
        for name in categories_list:
            cat = db.query(Category).filter(Category.name == name).first()
            if not cat:
                print(f"Creating category: {name}")
                cat = Category(id=uuid.uuid4(), name=name, is_active=True)
                db.add(cat)
                db.commit()
            category_map[name] = cat

        # 4. Create Sample Items (at least 15)
        sample_items = [
            ("iPhone 15", "Black iPhone 15 with a blue case", "Electronics", "found", "Downtown Cafe"),
            ("Passport", "Blue passport from USA", "Documents", "lost", "Airport Terminal 2"),
            ("Leather Wallet", "Brown leather wallet with ID", "Wallets & Bags", "found", "Central Park"),
            ("House Keys", "Set of 3 keys with a red keychain", "Keys", "lost", "Main St Bus Stop"),
            ("Winter Jacket", "North Face black jacket size L", "Clothing", "found", "Library"),
            ("Golden Retriever", "Friendly dog with a red collar", "Pets", "lost", "East Side Park"),
            ("Diamond Ring", "Gold band with a small diamond", "Jewelry", "found", "Shopping Mall"),
            ("USB Drive", "Silver 64GB SanDisk drive", "Electronics", "lost", "University Lab"),
            ("Driver License", "ID card for John Doe", "Documents", "found", "Cinema"),
            ("Backpack", "Blue hiking backpack", "Wallets & Bags", "lost", "Hiking Trail"),
            ("Car Keys", "Toyota key fob", "Keys", "found", "Parking Lot B"),
            ("Silk Scarf", "Red silk scarf", "Clothing", "lost", "Museum"),
            ("Cat", "Siamese cat with blue eyes", "Pets", "found", "Residential Area"),
            ("Earrings", "Pearl earrings in a small box", "Jewelry", "lost", "Gym"),
            ("Kindle", "Paperwhite with a cover", "Electronics", "found", "Train Station"),
        ]

        for title, desc, cat_name, itype, loc in sample_items:
            # Check if item already exists to keep it idempotent
            exists = db.query(Item).filter(Item.title == title, Item.user_id == demo_user.id).first()
            if not exists:
                print(f"Creating sample item: {title}")
                item = Item(
                    id=uuid.uuid4(),
                    title=title,
                    description=desc,
                    item_type=ItemType[itype.upper()],
                    status=ItemStatus.OPEN,
                    category_id=category_map[cat_name].id,
                    user_id=demo_user.id,
                    location=loc,
                    event_date=datetime.now(timezone.utc)
                )
                db.add(item)

        db.commit()
        print("\nDatabase seeding completed successfully!")

    except Exception as e:
        print(f"Error: Seeding failed: {e}")

        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
