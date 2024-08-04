import express from 'express'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const corsOptions = {
  origin: 'chrome-extension://mogkblnojamgejdhgffbelpikocalapb',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))
app.use(express.json())

// test endpoint
app.get('/', (req, res) => {
  res.send('Welcome to AI Image Generator')
})

app.post('/generate-images', async (req, res) => {
  const { prompt } = req.body

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/prompthero/openjourney-v4',
      { inputs: prompt },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SECRET_API_KEY}`,
        },
        responseType: 'arraybuffer', // Specify the response type as arraybuffer for binary data
      }
    )

    // Get content type from response headers
    const contentType = response.headers['content-type']

    // Ensure content type is defined before setting the header
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    } else {
      res.setHeader('Content-Type', 'application/octet-stream') // Fallback to a default content type
    }

    // Get the response body as a buffer (for binary data)
    const buffer = response.data

    res.send(Buffer.from(buffer))
  } catch (error) {
    res.status(500).send('Failed to generate images')
  }
})

app.post('/weather-forecast', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Helsinki&units=metric&appid=${process.env.OPEN_WEATHER_API_KEY}`
    )
    console.log('response:', response)
    if (!response.ok) {
      throw new Error('Response is not ok!')
    }
    const data = await response.json()
    res.send(data)
  } catch (error) {
    res.status(500).send('Failed to fetch weather forecast')
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
