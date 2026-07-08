const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const CHART_WIDTH = 800;
const CHART_HEIGHT = 400;

/** Lazy singleton — avoid loading native `canvas` at module import time (breaks Jest on Windows). */
let chartCanvas;

function getChartCanvas() {
  if (!chartCanvas) {
    chartCanvas = new ChartJSNodeCanvas({
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
      backgroundColour: 'white',
    });
  }

  return chartCanvas;
}

/** Same UTC date key format as log.controller and weekly-chart.component. */
function getUtcDateKey(daysAgo) {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() - daysAgo);
  return day.toISOString().slice(0, 10);
}

function formatDayLabel(dateKey) {
  const day = new Date(`${dateKey}T12:00:00.000Z`);
  return day.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
}

/** Bar color aligned with ProgressBarComponent: green / orange / red. */
function barColor(consumed, target) {
  if (!target) {
    return 'rgba(76, 175, 80, 0.75)';
  }

  const pct = (consumed / target) * 100;

  if (pct > 120) {
    return 'rgba(244, 67, 54, 0.75)';
  }

  if (pct > 100) {
    return 'rgba(255, 152, 0, 0.75)';
  }

  return 'rgba(76, 175, 80, 0.75)';
}

/**
 * Build chart series from daily logs (oldest → today, 7 days).
 * @param {Array<{ date: string, totalCaloriesConsumed: number, targetCalories: number }>} weekLogs
 */
function prepareChartData(weekLogs) {
  const logByDate = new Map(weekLogs.map((log) => [log.date, log]));
  const defaultTarget = weekLogs[0]?.targetCalories ?? 2000;
  const labels = [];
  const consumed = [];
  const targets = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const dateKey = getUtcDateKey(daysAgo);
    const log = logByDate.get(dateKey);

    labels.push(formatDayLabel(dateKey));
    consumed.push(log?.totalCaloriesConsumed ?? 0);
    targets.push(log?.targetCalories ?? defaultTarget);
  }

  const backgroundColor = consumed.map((value, index) =>
    barColor(value, targets[index])
  );

  return { labels, consumed, targets, backgroundColor };
}

/**
 * Render a weekly calorie bar chart with a target line as PNG buffer.
 * @param {Array<{ date: string, totalCaloriesConsumed: number, targetCalories: number }>} weekLogs
 * @returns {Promise<Buffer>}
 */
async function generateWeeklyChart(weekLogs) {
  const { labels, consumed, targets, backgroundColor } = prepareChartData(
    weekLogs ?? []
  );

  const configuration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'נצרך',
          data: consumed,
          type: 'bar',
          backgroundColor,
          borderRadius: 4,
        },
        {
          label: 'יעד',
          data: targets,
          type: 'line',
          borderColor: '#ff9800',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'סיכום קלוריות שבועי',
          font: { size: 16 },
        },
        legend: {
          position: 'top',
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'קק״ל',
          },
        },
      },
    },
  };

  return getChartCanvas().renderToBuffer(configuration);
}

module.exports = {
  generateWeeklyChart,
  prepareChartData,
};
