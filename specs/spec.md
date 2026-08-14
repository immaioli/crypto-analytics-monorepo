# Specification (Crypto Dashboard)

## 1. Objective
Build an interactive dashboard for market analysis of the top 10 cryptocurrencies, providing users with multiple graphical perspectives to facilitate decisions based on volume, market cap, and price fluctuations.

## 2. User Stories
- **Overview:** The user must see a list or cards with the Top 10 coins and their current basic information (Price, 24h Change, Volume, Market Cap).
- **Multiple Perspectives (Tabs):** The user must be able to click on a specific coin and toggle the graphical view between:
  1. Candlestick Chart (OHLC).
  2. Line/Area Chart (Closing price).
  3. Bar Chart (Volume attached to price).
- **Comparative Analysis:** The user must visualize the market cap proportion among coins (Heatmap/Treemap and Donut).
- **Advanced Metrics:** The user must compare metrics of a coin against its category using a Radar Chart (e.g., high volatility vs. volume).
- **Correlation:** The user must be able to select multiple coins (e.g., BTC and ETH) and see the percentage performance side-by-side on the same chart to identify correlation trends.
- **Time Filters:** On any time-series chart (lines, candles), the user can toggle between time periods (1D, 7D, 30D).

## 3. Non-Functional Requirements
- **Constant Availability:** If the third-party API goes down or hits limits, the user continues seeing the latest cached data without application crashes.
- **Performant Rendering:** Charts with many data points (e.g., 30-day time series at 5m resolution) must not block the UI thread.
- **Accessibility:** Navigation with good contrast and dark mode support.
