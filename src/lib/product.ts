import type { CollectionEntry } from 'astro:content';
import { differenceInMonths, formatYearMonth } from './time';

const SECTION_SEPARATOR = /\n-{3,}\s*\n/g;
const PERIOD_PATTERN = /^\d{4}-\d{2}-\d{2}\/(?:\d{4}-\d{2}-\d{2}|present)$/i;

export type PeriodRange = {
  start: Date;
  end: Date | null;
};

export type ProductTechStackItem = {
  name: string;
  note?: string;
};

export type ProductDeliverable = {
  label: string;
  url: string;
};

export interface ProductContentSections {
  overview: string;
  overviewSummary: string;
  period: string;
  techStack: ProductTechStackItem[];
  responsibilities: string[];
  improvements: string[];
  deliverables: ProductDeliverable[];
  extra?: string;
}

export interface ProductExperience {
  title: string;
  summary: string;
  periodLabel: string;
  durationMonths: number;
  responsibilities: string[];
  techStack: string[];
  deliverables: ProductDeliverable[];
  sortKey: number;
  includeInSkillsheet: boolean;
  content: ProductContentSections;
}

export function parseProductBody(body: string, slug?: string): ProductContentSections {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error(`products/${slug ?? 'unknown'} の本文が空です。'---' で区切ったセクションを記述してください。`);
  }

  const sections = trimmed.split(SECTION_SEPARATOR).map(section => section.trim());

  if (sections.length < 7) {
    throw new Error(`products/${slug ?? 'unknown'} の本文が ${sections.length} セクションしかありません。8つのセクション (概要, サマリ, 期間, 使用技術, 業務領域, 工夫点, 成果物, 余談) を '---' で区切ってください。余談は空でも構いませんが区切りは必要です。`);
  }

  const [
    overview,
    overviewSummary,
    period,
    techSection,
    responsibilitiesSection,
    improvementsSection,
    deliverablesSection,
    extraSection = '',
  ] = sections;

  if (!overview) {
    throw new Error(`products/${slug ?? 'unknown'} の概要セクションが空です。`);
  }

  if (!overviewSummary) {
    throw new Error(`products/${slug ?? 'unknown'} の概要サマリセクションが空です。スキルシート用の短いサマリを記載してください。`);
  }

  const periodValue = period.replace(/\s+/g, '').toLowerCase();
  if (!PERIOD_PATTERN.test(periodValue)) {
    throw new Error(`products/${slug ?? 'unknown'} の期間セクションは "YYYY-MM-DD/YYYY-MM-DD" もしくは "YYYY-MM-DD/present" 形式で記述してください。`);
  }

  return {
    overview,
    overviewSummary,
    period: periodValue,
    techStack: parseTechStack(techSection, slug),
    responsibilities: parseLineItems(responsibilitiesSection),
    improvements: parseLineItems(improvementsSection),
    deliverables: parseDeliverables(deliverablesSection, slug),
    extra: extraSection || undefined,
  } satisfies ProductContentSections;
}

function parseTechStack(section: string, slug?: string): ProductTechStackItem[] {
  const lines = parseLineItems(section);
  if (lines.length === 0) {
    throw new Error(`products/${slug ?? 'unknown'} の使用技術セクションに項目がありません。`);
  }

  return lines.map(line => {
    const pipeIndex = line.indexOf('|');
    const colonIndex = line.indexOf('：');
    const asciiColonIndex = line.indexOf(':');

    const separatorIndex = [pipeIndex, colonIndex, asciiColonIndex]
      .filter(index => index !== -1)
      .sort((a, b) => a - b)[0];

    if (separatorIndex === undefined) {
      return { name: line.trim() } satisfies ProductTechStackItem;
    }

    const name = line.slice(0, separatorIndex).trim();
    const note = line.slice(separatorIndex + 1).trim();

    if (!name) {
      throw new Error(`products/${slug ?? 'unknown'} の使用技術セクションで名前が空の項目があります。`);
    }

    return note
      ? { name, note }
      : { name };
  });
}

function parseLineItems(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[-*+]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function parseDeliverables(section: string, slug?: string): ProductDeliverable[] {
  const lines = parseLineItems(section);
  return lines.map(line => {
    const linkMatch = line.match(/^\[(.+?)\]\((https?:\/\/[^\s]+)\)$/);
    if (linkMatch) {
      return {
        label: linkMatch[1].trim(),
        url: linkMatch[2].trim(),
      } satisfies ProductDeliverable;
    }

    const parts = line.split('|');
    if (parts.length >= 2) {
      const label = parts[0]?.trim();
      const url = parts.slice(1).join('|').trim();
      if (!label || !url) {
        throw new Error(`products/${slug ?? 'unknown'} の成果物セクションのフォーマットが不正です。「ラベル | https://example.com」のように記載してください。`);
      }
      return { label, url } satisfies ProductDeliverable;
    }

    throw new Error(`products/${slug ?? 'unknown'} の成果物セクションにURLが含まれていません。「ラベル | https://example.com」またはMarkdownリンクで記載してください。`);
  });
}

export function parsePeriodRange(period: string): PeriodRange {
  const [startRaw, endRaw] = period.split('/');

  const start = new Date(startRaw);
  if (Number.isNaN(start.valueOf())) {
    throw new Error(`Invalid start date in period: ${period}`);
  }

  if (!endRaw || endRaw.toLowerCase() === 'present') {
    return { start, end: null };
  }

  const end = new Date(endRaw);
  if (Number.isNaN(end.valueOf())) {
    throw new Error(`Invalid end date in period: ${period}`);
  }

  return { start, end };
}

export function formatPeriodLabel(range: PeriodRange): string {
  const startLabel = formatYearMonth(range.start);

  if (!range.end) {
    return `${startLabel}-現在`;
  }

  const endLabel = formatYearMonth(range.end);
  return `${startLabel}-${endLabel}`;
}

export function calculateDurationMonths(range: PeriodRange, referenceDate = new Date()): number {
  const endDate = range.end ?? referenceDate;
  return Math.max(1, differenceInMonths(range.start, endDate));
}

export function buildProductExperience(entry: CollectionEntry<'products'>, referenceDate = new Date()): ProductExperience {
  const content = parseProductBody(entry.body, entry.slug);
  const range = parsePeriodRange(content.period);

  return {
    title: entry.data.title,
    summary: content.overviewSummary,
    periodLabel: formatPeriodLabel(range),
    durationMonths: calculateDurationMonths(range, referenceDate),
    responsibilities: content.responsibilities,
    techStack: content.techStack.map(item => item.name),
    deliverables: content.deliverables,
    sortKey: range.start.valueOf(),
    includeInSkillsheet: entry.data.includeInSkillsheet,
    content,
  } satisfies ProductExperience;
}
