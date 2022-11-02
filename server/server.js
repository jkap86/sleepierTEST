const express = require('express')
const path = require('path')
const app = express()
const compression = require('compression')
const cors = require('cors')
const axios = require('axios')
const weekly_rankings = require('./workers/worker_weeklyRankings')
const leagues = require('./workers/worker_leagues')
const syncLeague = require('./workers/worker_leagueSync')

app.use(compression())
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const getAllPlayers = async () => {
    const allplayers = await axios.get('https://api.sleeper.app/v1/players/nfl', { timeout: 3000 })
    app.set('allplayers', allplayers.data)
}
getAllPlayers()
setInterval(getAllPlayers, 1000 * 60 * 60 * 24)

app.get('/allplayers', (req, res) => {
    const allplayers = app.get('allplayers')
    res.send(allplayers)
})

app.get('/weeklyrankings', weekly_rankings)

app.get('/user', async (req, res) => {
    const username = req.query.username
    try {
        const user = await axios.get(`https://api.sleeper.app/v1/user/${username}`, { timeout: 3000 })
        res.send(user.data)
    } catch (error) {
        res.send('Invalid')
    }
})

app.get('/leagues', leagues)

app.get('/syncleague', syncLeague)

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
})

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`server running on port ${port}`);
});