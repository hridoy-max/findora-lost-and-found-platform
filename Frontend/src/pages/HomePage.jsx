import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getItems } from '../api/items';
import { normalizeList } from '../utils/normalizeList';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Search,
  ArrowRight,
  FileText,
  SearchCheck,
  Handshake,
  ShieldCheck,
  Lock,
  Users,
} from 'lucide-react';
import { ItemCard } from '../components/items/ItemCard';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

const POPULAR_SEARCHES = ['Wallet', 'Phone', 'Keys', 'Bag', 'ID card', 'Pet'];

const STEPS = [
  {
    icon: FileText,
    title: 'Submit a report',
    text: 'Provide the item name, a short description, the location, and a photo if you have one.',
  },
  {
    icon: SearchCheck,
    title: 'Review matches',
    text: 'Search the board for similar reports, or wait for the community to respond to yours.',
  },
  {
    icon: Handshake,
    title: 'Arrange the return',
    text: 'Confirm ownership with details only the owner would know, then agree on a safe handover.',
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Ownership verification',
    text: 'Finders are encouraged to ask for identifying details before returning an item.',
  },
  {
    icon: Lock,
    title: 'Privacy-conscious',
    text: 'Share only what is needed to identify an item. Keep personal details out of public posts.',
  },
  {
    icon: Users,
    title: 'Community-powered',
    text: 'Every report helps someone nearby. The more people contribute, the more items are returned.',
  },
];

const SectionHeader = ({ eyebrow, title, description, action }) => (
  <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cobalt">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-headings font-bold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-2 text-ink/60">{description}</p>}
    </div>
    {action}
  </div>
);

const SkeletonCard = () => (
  <div
    className="animate-pulse overflow-hidden rounded-2xl border border-line bg-surface"
    aria-hidden="true"
  >
    <div className="aspect-[4/3] bg-paper" />
    <div className="space-y-3 p-5">
      <div className="h-4 w-2/3 rounded bg-paper" />
      <div className="h-3 w-full rounded bg-paper" />
      <div className="h-3 w-1/2 rounded bg-paper" />
    </div>
  </div>
);

const HomePage = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['home-recent-items'],
    queryFn: async () => {
      const res = await getItems({ page_size: 6, sort_by: 'created_at', order: 'desc' });
      return normalizeList(res);
    },
    staleTime: 60 * 1000,
  });

  const goToSearch = (term) => {
    const value = term.trim();
    if (value) navigate(`/items?search=${encodeURIComponent(value)}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToSearch(search);
  };

  return (
    <main className="flex min-h-screen flex-col bg-paper">
      {/* 1. Hero */}
      <section className="border-b border-line bg-surface px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-headings font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              Reunite people with
              <br />
              what they <span className="text-cobalt">lost</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/60">
              Findora is a community lost and found board. Report an item you have lost or
              found, search existing reports, and arrange a safe return.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                className="rounded-lg px-6 py-3 text-base font-medium"
                onClick={() => navigate('/report?type=lost')}
              >
                Report a lost item
              </Button>
              <Button
                variant="secondary"
                className="rounded-lg px-6 py-3 text-base font-medium"
                onClick={() => navigate('/report?type=found')}
              >
                Report a found item
              </Button>
            </div>
          </div>

          {/* Search card */}
          <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-headings font-semibold text-ink">Search the board</h2>
            <p className="mt-1 text-sm text-ink/60">
              Check whether your item has already been reported.
            </p>

            <form onSubmit={handleSearch} role="search" className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="home-search" className="sr-only">
                  Search items
                </label>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
                  aria-hidden="true"
                />
                <Input
                  id="home-search"
                  type="search"
                  className="w-full rounded-lg border-line py-3 pl-10"
                  placeholder="e.g. black wallet, house keys"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!search.trim()}
                className="rounded-lg px-6 py-3"
              >
                Search
              </Button>
            </form>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink/50">
                Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => goToSearch(term)}
                    className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink/70 transition-colors hover:border-cobalt hover:text-cobalt focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20" aria-labelledby="how-heading">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to a return"
          description="A straightforward process for both owners and finders."
        />
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-7">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cobalt/10 text-cobalt">
                  <Icon size={22} />
                </div>
                <span className="text-sm font-semibold text-ink/40">Step {index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-headings font-semibold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink/60">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Recent reports */}
      <section
        className="border-y border-line bg-surface px-4 py-20"
        aria-labelledby="recent-heading"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Latest activity"
            title="Recent reports"
            description="The newest lost and found items posted by the community."
            action={
              <Button
                variant="secondary"
                onClick={() => navigate('/items')}
                className="group flex items-center gap-2 self-start rounded-lg text-sm font-medium sm:self-auto"
              >
                View all items
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Button>
            }
          />

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Unable to load recent reports"
              message="There was a problem fetching the latest items. Please try again."
              onRetry={refetch}
            />
          ) : !data?.length ? (
            <EmptyState
              title="No reports yet"
              description="Be the first to post a lost or found item."
              action={<Button onClick={() => navigate('/report')}>Create a report</Button>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Principles */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20" aria-labelledby="principles-heading">
        <SectionHeader
          eyebrow="Our approach"
          title="Built on trust and safety"
          description="Simple practices that keep returns safe for everyone involved."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cobalt/10 text-cobalt">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-headings font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Call to action */}
      <section className="px-4 pb-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl bg-ink px-8 py-12 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-headings font-bold text-white">
              Found something that is not yours?
            </h2>
            <p className="mt-2 text-white/70">
              Post a short report so the owner can find it. It only takes a couple of minutes.
            </p>
          </div>
          <Button
            variant="primary"
            className="rounded-lg px-6 py-3"
            onClick={() => navigate('/report?type=found')}
          >
            Report a found item
          </Button>
        </div>
      </section>
    </main>
  );
};

export default HomePage;