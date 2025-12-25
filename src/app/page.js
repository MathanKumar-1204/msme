import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-10 rounded-2xl bg-white p-10 shadow-sm lg:grid-cols-2">
      <div className="space-y-6">
        <p className="inline-flex rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Decentralized MSME Invoice Financing
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900">
          Turn your invoices into investable assets. Secure. Transparent. Fast.
        </h1>
        <p className="text-lg text-slate-600">
          Upload invoices as NFTs, let buyers acknowledge privately, and allow
          investors to finance verified invoices with clear pricing and status
          tracking.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
          >
            Create account
          </Link>
          <Link
            href="/marketplace"
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View marketplace
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              MSMEs
            </p>
            <p className="text-lg font-semibold text-slate-900">
              Tokenize & list invoices
            </p>
            <p className="mt-1">Upload PDFs, set price, track status.</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Investors
            </p>
            <p className="text-lg font-semibold text-slate-900">
              Discover verified cashflows
            </p>
            <p className="mt-1">Filter by amount, due date, or discount.</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Workflow</h2>
        <ol className="space-y-4 text-slate-700">
          <li className="flex gap-3">
            <span className="mt-1 h-8 w-8 rounded-full bg-indigo-100 text-center text-sm font-semibold leading-8 text-indigo-700">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-900">MSME uploads</p>
              <p>Invoice PDF, price, buyer email.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-8 w-8 rounded-full bg-indigo-100 text-center text-sm font-semibold leading-8 text-indigo-700">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-900">Buyer acknowledges</p>
              <p>Private confirmation flips status to Acknowledged.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-8 w-8 rounded-full bg-indigo-100 text-center text-sm font-semibold leading-8 text-indigo-700">
              3
            </span>
            <div>
              <p className="font-semibold text-slate-900">Investors fund</p>
              <p>Buy NFT UI triggers marked sale; blockchain kept UI-only.</p>
            </div>
          </li>
        </ol>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
          Wallet ready: Connect MetaMask on investor buy flow (frontend only).
        </div>
      </div>
    </div>
  );
}
