'use client'

import { useEffect, useMemo, useState } from 'react';
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import HeadInfo from '~/components/HeadInfo';
import { FeatherRepeat } from '~/components/FeatherRepeat';

type EpochUnit = 'auto' | 's' | 'ms' | 'us' | 'ns';

const formatLocal = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const detectUnit = (raw: string): Exclude<EpochUnit, 'auto'> => {
  const digits = raw.replace('-', '').length;
  if (digits >= 19) return 'ns';
  if (digits >= 16) return 'us';
  if (digits >= 13) return 'ms';
  return 's';
};

const toMillis = (value: string, unit: EpochUnit): number | null => {
  const num = Number(value.trim());
  if (!Number.isFinite(num)) return null;

  const resolvedUnit = unit === 'auto' ? detectUnit(value.trim()) : unit;

  if (resolvedUnit === 's') return num * 1000;
  if (resolvedUnit === 'ms') return num;
  if (resolvedUnit === 'us') return num / 1000;
  return num / 1_000_000;
};

const toDateTimeLocalValue = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const PageComponent = ({
  locale = '',
  timestampLanguageText,
  footerLanguageText,
  indexLanguageText,
}) => {
  const now = new Date();
  const [timestampInput, setTimestampInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState<EpochUnit>('auto');
  const [dateInput, setDateInput] = useState(() => toDateTimeLocalValue(now));

  const timestampConversion = useMemo(() => {
    const ms = toMillis(timestampInput, unit);
    if (ms === null) {
      return {
        isValid: false,
        local: '',
        utc: '',
        seconds: '',
        milliseconds: '',
        microseconds: '',
        nanoseconds: '',
      };
    }

    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      return {
        isValid: false,
        local: '',
        utc: '',
        seconds: '',
        milliseconds: '',
        microseconds: '',
        nanoseconds: '',
      };
    }

    return {
      isValid: true,
      local: formatLocal(date),
      utc: date.toUTCString(),
      seconds: String(Math.floor(ms / 1000)),
      milliseconds: String(Math.floor(ms)),
      microseconds: String(Math.floor(ms * 1000)),
      nanoseconds: String(Math.floor(ms * 1_000_000)),
    };
  }, [timestampInput, unit]);

  const dateToTimestamp = useMemo(() => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return null;

    const ms = date.getTime();
    return {
      seconds: String(Math.floor(ms / 1000)),
      milliseconds: String(ms),
      microseconds: String(ms * 1000),
      nanoseconds: String(ms * 1_000_000),
    };
  }, [dateInput]);

  const [currentEpoch, setCurrentEpoch] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <HeadInfo
        title={timestampLanguageText.title}
        description={timestampLanguageText.description}
        keywords={timestampLanguageText.keywords}
        locale={locale}
        page={''}
      />
      <Header locale={locale} page={''} indexLanguageText={indexLanguageText} />
      <main className="flex w-full flex-1 flex-col items-center">
        <div className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8">
          <section className="border-b border-orange-200/60 pb-8 pt-4" aria-labelledby="seo-hero-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="min-w-0">
                <h1 id="seo-hero-heading" className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  {timestampLanguageText.seo_hero_title}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
                  {timestampLanguageText.seo_hero_description}
                </p>
              </div>
            </div>
          </section>

          <section id="converter" className="py-4">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
              <h2 className="text-lg font-semibold tracking-tight">{timestampLanguageText.section_timestamp_to_date}</h2>
              <div className="text-right text-[11px] leading-snug opacity-70 sm:text-xs">
                <div>
                  {timestampLanguageText.current_unix_epoch}: <span className="tabular-nums font-semibold">{currentEpoch}</span>
                </div>
                <div>{timestampLanguageText.units_hint}</div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                id="timestamp"
                name="timestamp"
                className="w-full max-w-[min(100%,20rem)] rounded border border-orange-300 bg-white px-2.5 py-1.5 font-mono text-sm text-black tabular-nums shadow-sm"
                placeholder={timestampLanguageText.enter_timestamp_placeholder}
                value={timestampInput}
                onChange={(event) => setTimestampInput(event.target.value)}
              />
              <select
                id="timestamp_unit"
                name="timestamp_unit"
                className="min-w-[8.5rem] shrink-0 rounded border border-orange-300 bg-white px-2.5 py-1.5 text-sm text-black shadow-sm"
                value={unit}
                onChange={(event) => setUnit(event.target.value as EpochUnit)}
              >
                <option value="auto">{timestampLanguageText.unit_auto}</option>
                <option value="s">{timestampLanguageText.unit_seconds}</option>
                <option value="ms">{timestampLanguageText.unit_milliseconds}</option>
                <option value="us">{timestampLanguageText.unit_microseconds}</option>
                <option value="ns">{timestampLanguageText.unit_nanoseconds}</option>
              </select>
            </div>

            {timestampConversion.isValid ? (
              <div className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_local}</span><span className="tabular-nums">{timestampConversion.local}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_utc}</span><span className="tabular-nums">{timestampConversion.utc}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_seconds}</span><span className="tabular-nums">{timestampConversion.seconds}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_millis}</span><span className="tabular-nums">{timestampConversion.milliseconds}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_micros}</span><span className="tabular-nums">{timestampConversion.microseconds}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_nanos}</span><span className="tabular-nums">{timestampConversion.nanoseconds}</span></div>
              </div>
            ) : (
              <p className="text-sm text-red-500">{timestampLanguageText.invalid_timestamp}</p>
            )}
          </section>

          <div className="border-t border-orange-200/60" />

          <section className="py-4">
            <div className="mb-2">
              <h2 className="text-lg font-semibold tracking-tight">{timestampLanguageText.h2_2}</h2>
              <p className="mt-0.5 text-sm opacity-80">{timestampLanguageText.pick_date}</p>
            </div>
            <input
              type="datetime-local"
              className="datetime-local-tight mb-3 block rounded border border-orange-300 bg-white px-2.5 py-1.5 text-sm text-black shadow-sm"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
              step={1}
            />

            {dateToTimestamp ? (
              <div className="grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_seconds}</span><span className="tabular-nums">{dateToTimestamp.seconds}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_millis}</span><span className="tabular-nums">{dateToTimestamp.milliseconds}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_micros}</span><span className="tabular-nums">{dateToTimestamp.microseconds}</span></div>
                <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold">{timestampLanguageText.label_nanos}</span><span className="tabular-nums">{dateToTimestamp.nanoseconds}</span></div>
              </div>
            ) : (
              <p className="text-sm text-red-500">{timestampLanguageText.invalid_date}</p>
            )}
          </section>

          <div className="border-t border-orange-200/60" />

          <section className="py-6">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">{timestampLanguageText.what_is_unix_timestamp_title}</h2>
            <div className="space-y-2 text-sm leading-6 opacity-90">
              <p>{timestampLanguageText.what_is_unix_timestamp_p1}</p>
              <p>{timestampLanguageText.what_is_unix_timestamp_p2}</p>
              <p>{timestampLanguageText.what_is_unix_timestamp_p3}</p>
            </div>
          </section>

          <div className="border-t border-orange-200/60" />

          <section className="py-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight">{timestampLanguageText.code_examples_title}</h2>
              <p className="mt-1 text-sm opacity-90">
                {timestampLanguageText.code_examples_desc} <code>1800000000</code>.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm font-semibold">JavaScript</div>
                <pre className="overflow-auto rounded-md bg-black/80 p-3 text-xs text-white">
{`// now (seconds)
Math.floor(Date.now() / 1000)

// epoch -> date
new Date(1800000000 * 1000).toISOString()`}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-sm font-semibold">Python</div>
                <pre className="overflow-auto rounded-md bg-black/80 p-3 text-xs text-white">
{`import time

# now (seconds)
int(time.time())

# epoch -> date (local)
time.ctime(1800000000)`}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-sm font-semibold">Go</div>
                <pre className="overflow-auto rounded-md bg-black/80 p-3 text-xs text-white">
{`package main

import (
  "fmt"
  "time"
)

func main() {
  fmt.Println(time.Now().Unix())
  fmt.Println(time.Unix(1800000000, 0).UTC())
}`}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-sm font-semibold">SQL (PostgreSQL)</div>
                <pre className="overflow-auto rounded-md bg-black/80 p-3 text-xs text-white">
{`-- now (seconds)
SELECT EXTRACT(EPOCH FROM now());

-- epoch -> timestamp
SELECT TO_TIMESTAMP(1800000000);`}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-sm font-semibold">Unix/Linux shell</div>
                <pre className="overflow-auto rounded-md bg-black/80 p-3 text-xs text-white">
{`date +%s
date -d @1800000000`}
                </pre>
              </div>

              <div>
                <div className="mb-1 text-sm font-semibold">macOS</div>
                <pre className="overflow-auto rounded-md bg-black/80 p-3 text-xs text-white">
{`date +%s
date -j -r 1800000000`}
                </pre>
              </div>
            </div>
          </section>

          <section className="border-t border-orange-200/60 py-10" aria-labelledby="seo-features-heading">
            <h2 id="seo-features-heading" className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              {timestampLanguageText.seo_features_title}
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2">
              {[
                [timestampLanguageText.seo_feature_1_title, timestampLanguageText.seo_feature_1_desc],
                [timestampLanguageText.seo_feature_2_title, timestampLanguageText.seo_feature_2_desc],
                [timestampLanguageText.seo_feature_3_title, timestampLanguageText.seo_feature_3_desc],
                [timestampLanguageText.seo_feature_4_title, timestampLanguageText.seo_feature_4_desc],
              ].map(([title, desc]) => (
                <li key={title} className="rounded-lg border border-stone-200 bg-stone-50/80 p-4">
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{desc}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-orange-200/60 py-10" aria-labelledby="seo-how-heading">
            <h2 id="seo-how-heading" className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              {timestampLanguageText.seo_how_title}
            </h2>
            <ol className="mt-6 space-y-6">
              {[
                [timestampLanguageText.seo_how_step_1_title, timestampLanguageText.seo_how_step_1_desc],
                [timestampLanguageText.seo_how_step_2_title, timestampLanguageText.seo_how_step_2_desc],
                [timestampLanguageText.seo_how_step_3_title, timestampLanguageText.seo_how_step_3_desc],
              ].map(([title, desc], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-stone-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-orange-200/60 py-10" aria-labelledby="seo-why-heading">
            <h2 id="seo-why-heading" className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              {timestampLanguageText.seo_why_title}
            </h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                [timestampLanguageText.seo_why_1_title, timestampLanguageText.seo_why_1_desc],
                [timestampLanguageText.seo_why_2_title, timestampLanguageText.seo_why_2_desc],
                [timestampLanguageText.seo_why_3_title, timestampLanguageText.seo_why_3_desc],
              ].map(([title, desc]) => (
                <li key={title} className="rounded-lg border border-orange-200/60 bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{desc}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-orange-200/60 py-10" aria-labelledby="seo-testimonials-heading">
            <h2 id="seo-testimonials-heading" className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              {timestampLanguageText.seo_testimonials_title}
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                [timestampLanguageText.seo_testimonial_1_quote, timestampLanguageText.seo_testimonial_1_name, timestampLanguageText.seo_testimonial_1_role],
                [timestampLanguageText.seo_testimonial_2_quote, timestampLanguageText.seo_testimonial_2_name, timestampLanguageText.seo_testimonial_2_role],
                [timestampLanguageText.seo_testimonial_3_quote, timestampLanguageText.seo_testimonial_3_name, timestampLanguageText.seo_testimonial_3_role],
              ].map(([quote, name, role]) => (
                <blockquote
                  key={name}
                  className="rounded-lg border border-stone-200 bg-stone-50/80 p-4 text-sm leading-relaxed text-stone-700"
                >
                  <p className="italic">&ldquo;{quote}&rdquo;</p>
                  <footer className="mt-3 text-xs font-semibold text-stone-900">
                    {name}
                    <span className="block font-normal text-stone-500">{role}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>

          <section className="border-t border-orange-200/60 py-10" aria-labelledby="seo-faq-heading">
            <h2 id="seo-faq-heading" className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
              {timestampLanguageText.seo_faq_title}
            </h2>
            <dl className="mt-6 space-y-6">
              {[
                [timestampLanguageText.seo_faq_q1, timestampLanguageText.seo_faq_a1],
                [timestampLanguageText.seo_faq_q2, timestampLanguageText.seo_faq_a2],
                [timestampLanguageText.seo_faq_q3, timestampLanguageText.seo_faq_a3],
                [timestampLanguageText.seo_faq_q4, timestampLanguageText.seo_faq_a4],
                [timestampLanguageText.seo_faq_q5, timestampLanguageText.seo_faq_a5],
              ].map(([q, a]) => (
                <div key={q}>
                  <dt className="font-semibold text-stone-900">{q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">{a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border-t border-orange-200/60 py-10" aria-labelledby="seo-cta-heading">
            <div className="rounded-xl border border-orange-300 bg-orange-50 px-6 py-8 text-center sm:px-10">
              <h2 id="seo-cta-heading" className="text-xl font-bold text-stone-900 sm:text-2xl">
                {timestampLanguageText.seo_cta_title}
              </h2>
              <p className="mt-2 text-sm text-stone-600">{timestampLanguageText.seo_cta_desc}</p>
              <a
                href="#converter"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                {timestampLanguageText.seo_cta_button}
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer
        locale={locale}
        description={indexLanguageText.description}
        footerText={footerLanguageText}
      />
    </>
  );
};

export default PageComponent;
