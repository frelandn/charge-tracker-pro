const Charts = {
  efficiencyInstance: null,
  distanceInstance: null,

  render() {
    const logs = Data.getLogs().filter(l => !l.isFullCharge).slice().reverse();

    const labels = logs.map(l => l.date);
    const distances = logs.map(l => parseFloat(l.dist).toFixed(2));
    
    const efficiencies = logs.map(l => {
      const val = parseFloat(l.pctPerKm);
      return val > 0 ? val.toFixed(2) : null;
    });

    const costRates = logs.map(l => {
      const consCostVal = parseFloat(l.consCost !== undefined ? l.consCost : l.cost) || 0;
      const distVal = parseFloat(l.dist) || 0;
      const cpkVal = parseFloat(l.costPerKm !== undefined ? l.costPerKm : (distVal > 0 ? consCostVal / distVal : 0)) || 0;
      return cpkVal > 0 ? cpkVal.toFixed(2) : null;
    });

    if (Charts.efficiencyInstance) Charts.efficiencyInstance.destroy();
    if (Charts.distanceInstance) Charts.distanceInstance.destroy();

    const ctxEff = document.getElementById('efficiencyChart').getContext('2d');
    Charts.efficiencyInstance = new Chart(ctxEff, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Efficiency (%/km)',
            data: efficiencies,
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'yEff',
            pointRadius: 4,
            spanGaps: true
          },
          {
            label: 'Cost Rate (₱/km)',
            data: costRates,
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            yAxisID: 'yCost',
            pointRadius: 4,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { display: false } },
          yEff: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: '#10b981', font: { size: 10 } },
            grid: { color: '#334155' },
            title: { display: true, text: '%/km', color: '#10b981', font: { size: 10 } }
          },
          yCost: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: '#f59e0b', font: { size: 10 } },
            grid: { drawOnChartArea: false },
            title: { display: true, text: '₱/km', color: '#f59e0b', font: { size: 10 } }
          }
        }
      }
    });

    const ctxDist = document.getElementById('distanceChart').getContext('2d');
    Charts.distanceInstance = new Chart(ctxDist, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Distance (km)',
            data: distances,
            backgroundColor: 'rgba(56, 189, 248, 0.4)',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { display: false } },
          y: {
            ticks: { color: '#38bdf8', font: { size: 10 } },
            grid: { color: '#334155' },
            title: { display: true, text: 'km', color: '#38bdf8', font: { size: 10 } }
          }
        }
      }
    });
  }
};