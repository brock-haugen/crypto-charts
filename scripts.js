(function () {
  var config = {
    url: 'https://api.bitfinex.com/v2',
    N: 24,
    K: 2,
    maxPoints: 1000,
    tickers: [
      'ethusd',
      // 'ethbtc',
      'btcusd',
      'ltcusd',
      // 'ltcbtc',
      'eosusd',
      // 'eosbtc',
      'iotusd',
      // 'iotbtc',
      'zecusd',
      // 'zecbtc',
      'xrpusd',
      // 'xrpbtc',
      'xmrusd',
      // 'xmrbtc',
    ]
  }
  Chart.defaults.global.tooltips.enabled = false
  Chart.defaults.global.elements.point.radius = 0
  Chart.defaults.global.elements.point.hoverRadius = 0

  var request = function (url, callback) {
    var xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        callback(JSON.parse(xhttp.responseText))
      }
    },

    xhttp.open('GET', url, true)
    xhttp.send()
  }

  // get the historical candle data
  // format is MTS, OPEN, CLOSE, HIGH, LOW, VOLUME
  var getCandles = function (ticker, callback) {
    return request(`${config.url}/candles/trade:5m:t${ticker.toUpperCase()}/hist`, callback)
  }

  // compute the average of a set of numbers
  var average = function (data) {
    return data.reduce(function (a, b) {
      return a + b
    }, 0) / data.length
  }

  // compute standard deviation
  var standardDeviation = function (data) {
    var avg = average(data)
    var squareDiffs = data.map(function (v) {
      var d = v - avg
      return d * d
    })
    var avgSquareDiff = average(squareDiffs)
    return Math.sqrt(avgSquareDiff)
  }

  // compute Bollinger Bands
  var bollingerBands = function (prices, timestamps) {
    return prices.slice(0, -(config.N - 1)).map((d, i) => {
      var range = prices.slice(i, config.N + i)
      var avg = average(range)
      var std = config.K * standardDeviation(range)
      return {
        actual: range.pop(),
        high: avg + std,
        mid: avg,
        low: avg - std,
        timestamp: timestamps[i]
      }
    })
  }

  // create DOM chart
  var tickerChart = function (ticker, bands) {
    var container = document.createElement('div')
    container.style.width = Math.max(document.body.scrollWidth / 2, 650)
    container.style.display = 'inline-block'
    var canvas = document.createElement('canvas')
    canvas.id = ticker
    container.appendChild(canvas)
    document.body.appendChild(container)

    var dateLabels = bands.map(b => new Date(b.timestamp).toLocaleString())

    var ctx = document.getElementById(canvas.id).getContext('2d')
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dateLabels,
        datasets: [{
          type: 'line',
          label: 'Actual',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: 'lime',
          data: bands.map(b => b.actual)
        }, {
          type: 'line',
          label: 'Mid BB',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: 'red',
          data: bands.map(b => b.mid)
        }, {
          type: 'line',
          label: 'Upper BB',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: 'blue',
          data: bands.map(b => b.high)
        }, {
          type: 'line',
          label: 'Lower BB',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: 'blue',
          data: bands.map(b => b.low)
        // }, {
        //   type: 'line',
        //   label: 'BB Width',
        //   backgroundColor: 'orange',
        //   borderColor: 'orange',
        //   data: bands.map(b => b.high - b.low)
        }]
      },
      options: {
        title: {
          display: true,
          text: ticker.toUpperCase()
        }
      }
    })
  }

  config.tickers.forEach(t => {
    getCandles(t, function (candles) {
      var prices = candles.map(c => average(c.slice(1, 5)))
      var timestamps = candles.map(c => c[0])
      var bollingers = bollingerBands(prices, timestamps)
      bollingers.reverse()
      tickerChart(t, bollingers)
    })
  })
})()
