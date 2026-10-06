import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Dashboard from '../views/Dashboard.vue'

// Mock the API layer so the component mounts against deterministic,
// in-memory fixtures instead of hitting the real backend.
vi.mock('../api', () => ({
  api: {
    getDashboardSummary: vi.fn().mockResolvedValue({ total_orders_value: 0 }),
    getOrders: vi.fn(),
    getInventory: vi.fn(),
    getBacklog: vi.fn().mockResolvedValue([])
  }
}))

import { api } from '../api'

// 7 single-item orders for 7 distinct SKUs. Order dates run Jan -> Jul
// (ascending), while revenue is deliberately NOT in date order, so a
// date-sorted result is trivially distinguishable from a revenue-sorted one.
const SKUS = [
  { sku: 'P1', name: 'Alpha Widget', revenue: 100, month: '01' },
  { sku: 'P2', name: 'Bravo Widget', revenue: 200, month: '02' },
  { sku: 'P3', name: 'Charlie Widget', revenue: 300, month: '03' },
  { sku: 'P4', name: 'Delta Widget', revenue: 900, month: '04' },
  { sku: 'P5', name: 'Echo Widget', revenue: 800, month: '05' },
  { sku: 'P6', name: 'Foxtrot Widget', revenue: 700, month: '06' },
  { sku: 'P7', name: 'Golf Widget', revenue: 600, month: '07' }
]

const orders = SKUS.map((p, i) => ({
  id: String(i + 1),
  order_number: `ORD-2025-000${i + 1}`,
  customer: 'Test Customer',
  items: [{ sku: p.sku, name: p.name, quantity: 1, unit_price: p.revenue }],
  status: 'Delivered',
  warehouse: 'San Francisco',
  category: 'Circuit Boards',
  order_date: `2025-${p.month}-10T10:00:00`,
  expected_delivery: `2025-${p.month}-20T10:00:00`,
  actual_delivery: `2025-${p.month}-18T10:00:00`,
  total_value: p.revenue
}))

const inventory = SKUS.map((p, i) => ({
  id: String(i + 1),
  sku: p.sku,
  name: p.name,
  category: 'Circuit Boards',
  warehouse: 'San Francisco',
  quantity_on_hand: 500,
  reorder_point: 100,
  unit_cost: 10,
  location: 'Warehouse A-1',
  last_updated: '2025-01-01T00:00:00'
}))

// Expected top 5 by revenue, descending: P4(900) P5(800) P6(700) P7(600) P3(300)
const EXPECTED_ORDER = ['P4', 'P5', 'P6', 'P7', 'P3']

describe('Dashboard Top Products (specs/top-products-chart-diagonal-labels.md)', () => {
  beforeEach(() => {
    api.getOrders.mockResolvedValue(orders)
    api.getInventory.mockResolvedValue(inventory)
  })

  it('shows the same top 5 products, in the same revenue-descending order, in both the chart and the table', async () => {
    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          ProductDetailModal: true,
          BacklogDetailModal: true,
          PurchaseOrderModal: true
        }
      }
    })

    await flushPromises()

    const barSkus = wrapper.findAll('.product-bar-wrapper').map((w) => {
      const label = w.find('.product-bar-label').text()
      return SKUS.find((p) => p.name === label)?.sku
    })

    const tableSkus = wrapper.findAll('tbody tr').map((row) => row.find('td').text())
      .map((name) => SKUS.find((p) => p.name === name)?.sku)

    expect(barSkus).toHaveLength(5)
    expect(tableSkus).toHaveLength(5)
    expect(barSkus).toEqual(EXPECTED_ORDER)
    expect(tableSkus).toEqual(EXPECTED_ORDER)
  })
})
