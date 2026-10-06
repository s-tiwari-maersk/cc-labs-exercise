# Spec: Diagonal labels on the Top Products chart, and table aligned to it

Switch the dashboard's bottom bar chart to diagonal (-45deg) product name labels
with columns wide enough that full names never collide, cut both the chart and
the table above it down to the same top 5 products by revenue.

## Context

The bottom chart on the dashboard (`client/src/views/Dashboard.vue`,
`.product-bar-chart`) currently renders 10 bars, each labelled with the full
product name rotated -90deg (vertical, reading bottom-to-top) inside a fixed
230px-tall band. Vertical text was chosen to stop long names from colliding in
the narrow ~70-100px columns, but it's awkward to read. The request is to go
back to a readable diagonal angle — which only works if the columns are wide
enough to hold a full diagonal name, which in turn means fewer bars fit.

That cascades into the "Top Products" table directly above the chart: it
currently shows 12 products sorted by first-order date (revenue as tiebreaker),
so the two sections disagree about what "top products" means. They should show
the same 5 products in the same order.

No ADR constrains this. It stays frontend-only: `docs/adr/0002` fixes product
aggregation as client-side work over in-memory data (the `productAggregates`
computed), which is where both the chart and table already get their data, and
`docs/adr/0003` is unaffected since no API call changes.

## Behaviour / Requirements

- Product name labels under each bar are rotated -45deg (diagonal), not the
  current -90deg vertical.
- Labels show the complete product name — no ellipsis, no truncation.
- Each bar's column is wide enough (~150px) that a full diagonal name never
  visually overlaps the neighbouring bar's label at standard desktop width.
- The chart shows the top 5 products by revenue (down from 10).
- The "Top Products" table above the chart shows the same 5 products, sorted
  by revenue descending — so the table's top-to-bottom order matches the
  chart's left-to-right order. Its current first-order-date sort is dropped.
- Bars keep a fixed column width and sit left-aligned; they do not stretch or
  spread to fill the card.
- Headings, in all three locales (`client/src/locales/{en,ja,pt_BR}.js`):
  - table (`dashboard.topProducts.title`): "Top 5 Products by Revenue"
  - chart (`dashboard.topProductsChart.title`): "Top 5 Products by Revenue (Chart)"

## Edge Cases

- Card too narrow for 5 wide columns (small laptop, tablet): the chart scrolls
  horizontally. Columns keep their width — they never compress to fit, because
  compressing reintroduces label collisions.
- Filters match fewer than 5 products: the bars that exist keep the same fixed
  width and stay left-aligned, leaving empty space on the right.
- Filters match zero products: unchanged — the existing "no data" message
  shows instead of the chart.
- Longest name in the current dataset, "24V 3A Industrial Power Supply" (30
  characters, `server/data/inventory.json`), must fit at -45deg within one
  column's width without truncation.

## Out of Scope

- Bar colours/gradient, bar height scaling, and the revenue value label above
  each bar (`$X.XK`, or full currency when JPY is selected) — unchanged.
- Hover tooltips on bars and labels — unchanged.
- The table's columns (SKU, Category, Units Ordered, Revenue, First Order,
  Stock Status) and its row-click product modal — unchanged; only the row
  count and sort order change.
- Other charts: Reports' monthly revenue trend, Inventory by Category, and
  anything in Spending — untouched.
- Backend, API, and data changes — aggregation stays client-side over the
  existing filtered `allOrders` / `inventoryItems`, per ADR-0002.

## Acceptance Criteria

- [ ] With no filters applied, the chart renders exactly 5 bars.
- [ ] Every label is rendered diagonally at -45deg and shows the complete
      product name — no "..." appears on any label.
- [ ] At standard desktop dashboard width, no label's text visually touches or
      overlaps an adjacent label.
- [ ] If "24V 3A Industrial Power Supply" is among the top 5, its label renders
      in full without truncation or clipping.
- [ ] The table above lists exactly 5 rows, containing the same 5 products as
      the chart, ordered highest revenue first — the first table row is the
      leftmost (tallest) bar, and the fifth row is the rightmost bar.
- [ ] Narrowing the browser window produces a horizontal scrollbar on the
      chart; column width and label legibility are unchanged while scrolling.
- [ ] Applying a filter combination that yields only 2 products shows 2 bars at
      the same column width as a full chart, left-aligned, with empty space to
      the right.
- [ ] Applying a filter combination that yields 0 products shows the existing
      "no data" message, not an empty chart frame.
- [ ] The table heading reads "Top 5 Products by Revenue" and the chart heading
      reads "Top 5 Products by Revenue (Chart)"; switching the app to Japanese
      and to Brazilian Portuguese shows translated versions of both, not
      English fallback text.
- [ ] Bar colours, the per-bar revenue value labels, and hover tooltips are
      visually identical to before the change.
