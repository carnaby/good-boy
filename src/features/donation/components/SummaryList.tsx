'use client';

import styled from 'styled-components';
import Link from 'next/link';

export interface SummaryRow {
  label: string;
  value: string;
}

export interface SummaryGroup {
  /** Rendered top-left of the group header; omit for a group with no heading of its own. */
  title?: string;
  rows: SummaryRow[];
  editHref: string;
  editLabel: string;
  editAriaLabel: string;
}

export interface SummaryListProps {
  groups: SummaryGroup[];
}

const List = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

// Divider between groups (Figma: a 1px `border`-token rule separating the
// "help + amount" rows from the "personal details" rows) — `border-bottom`
// on every group but the last renders exactly one such rule regardless of
// how many groups are passed in.
const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(5)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
  min-height: 24px;
`;

const GroupTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.bodySemibold.fontSize};
  line-height: ${({ theme }) => theme.typography.bodySemibold.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodySemibold.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// Figma's step 3 frame has no edit links at all — the product spec requires
// them regardless, so this is a from-scratch "subtle text link" treatment
// (primary color, label-sized) rather than a direct-from-Figma read.
const EditLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.labelMedium.fontSize};
  line-height: ${({ theme }) => theme.typography.labelMedium.lineHeight};
  font-weight: ${({ theme }) => theme.typography.labelMedium.fontWeight};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`;

const Dl = styled.dl`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  width: 100%;
`;

// dt over dd below \`md\` (a narrow viewport leaves too little room for a
// long label AND a long value on one line), side by side (label left /
// value right) from \`md\` up.
const Row = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing(4)};
  }
`;

const Label = styled.dt`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.body.fontSize};
  line-height: ${({ theme }) => theme.typography.body.lineHeight};
  font-weight: ${({ theme }) => theme.typography.body.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Value = styled.dd`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.bodySemibold.fontSize};
  line-height: ${({ theme }) => theme.typography.bodySemibold.lineHeight};
  font-weight: ${({ theme }) => theme.typography.bodySemibold.fontWeight};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: left;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    text-align: right;
  }
`;

/**
 * Read-only "review your details" list for step 3 — one `<dl>` per group
 * (label left/regular, value right/semibold, per Figma), separated by a
 * divider, each with an "Upraviť" edit link back to the step that produced
 * it. Presentational only: the caller (`Step3`) supplies already-formatted
 * row values and resolved i18n strings.
 */
export function SummaryList({ groups }: SummaryListProps) {
  return (
    <List>
      {groups.map((group) => (
        <Group key={group.editHref}>
          <GroupHeader>
            {group.title ? <GroupTitle>{group.title}</GroupTitle> : <span />}
            <EditLink href={group.editHref} aria-label={group.editAriaLabel}>
              {group.editLabel}
            </EditLink>
          </GroupHeader>
          <Dl>
            {group.rows.map((row) => (
              <Row key={row.label}>
                <Label>{row.label}</Label>
                <Value>{row.value}</Value>
              </Row>
            ))}
          </Dl>
        </Group>
      ))}
    </List>
  );
}
