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
    return request(`${config.url}/candles/trade:6h:t${ticker.toUpperCase()}/hist`, callback)
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

  // compute the Keltner channel
  var keltnerChannel = function (close, high, low) {
    return average([close, high, low])
  }

  // compute the Simple Moving Average
  var simpleMovingAverage = function (data) {
    return data.slice(config.N).map(function (d, i) {
      return average(data.slice(i, config.N + i))
    })
  }

  // compute Bollinger Band
  var bollingerBands = function (data, N, K) {
    N = N || config.N
    K = K || config.K
    return data.slice(N - 1).map((d, i) => {
      var range = data.slice(i, N + i)
      var avg = average(range)
      var std = standardDeviation(range)
      return [
        avg + K * std,
        avg - K * std
      ]
    })
  }

  // compute Bollinger Band width
  var bollingerBandWidth = function (data) {
    return data.map(d => d[0] - d[1])
  }

  // create DOM chart
  var tickerChart = function (ticker, keltner, bollinger, bandWidths) {
    var minLength = Math.min(keltner.length, bollinger.length, bandWidths.length, config.maxPoints)
    var dateLabels = Array(minLength).fill(0).map(function (d, i) {
      return new Date(Date.now() - 24 * 60 * 60 * 1000 * i / 4).toDateString()
    }).reverse()

    keltner = keltner.slice(-minLength)
    bollinger = bollinger.slice(-minLength)
    bandWidths = bandWidths.slice(-minLength)

    var colors = [
      'rgb(255, 92, 138)',
      'rgb(138, 92, 255)',
      'rgb(138, 92, 255)',
      'rgb(255, 138, 92)'
    ]

    var container = document.createElement('div')
    container.style.width = Math.max(document.body.scrollWidth / 2, 650)
    container.style.display = 'inline-block'
    var canvas = document.createElement('canvas')
    canvas.id = ticker
    container.appendChild(canvas)
    document.body.appendChild(container)

    var ctx = document.getElementById(canvas.id).getContext('2d')
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dateLabels,
        datasets: [{
          type: 'line',
          label: 'Keltner Channel',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: colors[0],
          data: keltner
        }, {
          type: 'line',
          label: 'Bollinger Upper Belt',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: colors[1],
          data: bollinger.map(function (b) { return b[0] })
        }, {
          type: 'line',
          label: 'Bollinger Lower Belt',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: colors[2],
          data: bollinger.map(function (b) { return b[1] })
        }, {
          type: 'line',
          label: 'Bollinger Band Width',
          backgroundColor: colors[3],
          borderColor: colors[3],
          data: bandWidths
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
      var keltner = candles.map(function (c) {
        return keltnerChannel.apply(this, c.slice(2, 5))
      })
      var bollingers = bollingerBands(keltner)
      var bandWidths = bollingerBandWidth(bollingers)
      tickerChart(t, keltner, bollingers, bandWidths)
    })
  })
})()
