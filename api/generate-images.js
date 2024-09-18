import express from 'express'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'
import sharp from 'sharp'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (origin && origin.startsWith('chrome-extension://')) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   allowedHeaders: 'Content-Type,Authorization',
//   credentials: true,
// }

// app.use(cors(corsOptions))
app.use(cors())
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
  const { city, tempScale } = req.body

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${tempScale}&appid=${process.env.OPEN_WEATHER_API_KEY}`
    )
    const data = await response.json()
    res.send(data)
  } catch (error) {
    res.status(500).send('Failed to fetch weather forecast')
  }
})

app.post('/stability-model', async (req, res) => {
  const { prompt, width, height } = req.body

  try {
    const response = await fetch(
      `https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
            },
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          // height: 640,
          // width: 640,
          steps: 30,
          samples: 1,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Non-200 response: ${await response.text()}`)
    }

    const data = await response.json();
    const imageBuffer = Buffer.from(data.artifacts[0].base64, 'base64');

    // Compress the image
    const compressedImageBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 70 })
      .toBuffer();

    // Convert compressed image back to base64
    const base64CompressedImage = compressedImageBuffer.toString('base64');

    // Send response in JSON format with compressed base64 image
    res.json({
      artifacts: [
        {
          base64: base64CompressedImage,
          seed: data.artifacts[0].seed,
          finishReason: data.artifacts[0].finishReason,
        },
      ],
    });
  } catch (error) {
    res.status(500).send('Failed to fetch images')
    console.log('👀 Error while fetching the data: ', error)
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
