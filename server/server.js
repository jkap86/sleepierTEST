const express = require('express')
const path = require('path')
const app = express()
const compression = require('compression')
const cors = require('cors')
const axios = require('axios')
const { updateUser, getLeagues, syncLeague, updateAllLeagues } = require('./queries');
const { getWeeklyRankings, match_weekly_rankings } = require('./syncFunctions');
const { getLeagueSync } = require('./workers/worker_leagueSync');
const { Pool } = require('pg');

app.use(compression())
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const connectionString = process.env.DATABASE_URL
const ssl = process.env.HEROKU ? { rejectUnauthorized: false } : false
const db = new Pool({
    connectionString: connectionString, ssl: ssl
})

const options = {
    headers: {
        'content-type': 'application/json'
    },
    timeout: 5000
}

const dailySync = async () => {
    console.log('Syncing...')
    const state = await axios.get('https://api.sleeper.app/v1/state/nfl', options)
    app.set('state', state.data)
    const season = state.data.season
    await db.query(
        `CREATE TABLE IF NOT EXISTS users (user_id VARCHAR(255) PRIMARY KEY, username VARCHAR(255), avatar VARCHAR(255), leagues_${season} JSONB, updated TIMESTAMP )`,
    )
    console.log('users table created')
    await db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS leagues_${season} JSONB`
    )
    console.log('leagues column created')
    await db.query(
        `CREATE TABLE IF NOT EXISTS leagues_${season} (league_id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), avatar VARCHAR(255), best_ball INTEGER, type INTEGER, scoring_settings JSONB, roster_positions JSONB, users JSONB, rosters JSONB, updated TIMESTAMP)`
    )
    const schedule = await axios.get(`https://api.sportsdata.io/v3/nfl/scores/json/Schedules/%7B2022%7D?key=d5d541b8c8b14262b069837ff8110635`, options)
    const allplayers = await axios.get('https://api.sleeper.app/v1/players/nfl', options)
    const weekly_rankings = await getWeeklyRankings(axios)
    if (schedule.data && allplayers.data && weekly_rankings) {
        const updated_players = match_weekly_rankings(weekly_rankings, allplayers.data, schedule.data)
        app.set('allplayers', updated_players)
    } else if (allplayers.data) {
        app.set('allplayers', allplayers.data)
    }
    console.log('Daily Sync Complete')
}
dailySync()


const date = new Date()
const hour = date.getHours()
const minute = date.getMinutes()
const delay = ((26 - hour) * 60 * 60) + ((60 - minute) * 60)
setTimeout(() => {
    const date = new Date()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    console.log(`All Players updated at ${hour}:${minute}:${second}`)
    dailySync()
    setInterval(() => {
        dailySync()
        console.log(`All Players updated at ${hour}:${minute}:${second}`)
    }, 1000 * 60 * 60 * 24)
}, delay)

setInterval(async () => {
    const state = app.get('state')
    await updateAllLeagues(axios, db, state.season)
    const date = new Date()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    const weekly_rankings = await getWeeklyRankings(axios)
    app.set('weekly_rankings', weekly_rankings)
    console.log(`Weekly Rankings updated at ${hour}:${minute}:${second}`)
}, 1000 * 60 * 15)


app.get('/update', async (req, res) => {
    const state = app.get('state')
    const update = await updateAllLeagues(axios, db, state.season)
    res.send(update)
})

app.get('/allplayers', (req, res) => {
    const allplayers = app.get('allplayers')
    res.send(allplayers)
})

app.get('/user', async (req, res, next) => {
    const username = req.query.username
    let user;
    try {
        user = await axios.get(`https://api.sleeper.app/v1/user/${username}`)
        res.send(user.data)
    } catch (error) {
        console.log('error')
        res.send(error)
    }
})
app.get('/leagues', async (req, res, next) => {
    const state = app.get('state')
    const user = req.query.user
    req.user = user
    const leagues = await axios.get(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${state.season}`, options)
    req.leagues = leagues.data
    await updateUser(db, user, leagues.data, state.season)
    next()
}, async (req, res) => {
    const state = app.get('state')
    const current_leagues = await getLeagues(axios, db, req.leagues, state.season, req.user.user_id)

    res.send(current_leagues.sort((a, b) => a.index - b.index))
})

app.get('/syncleague', async (req, res) => {
    const state = app.get('state')
    const league_id = req.query.league_id
    const user_id = req.query.user_id

    const league = await getLeagueSync(axios, league_id, user_id)
    await syncLeague(db, league, state.season)


    res.send(league)
})

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
})

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`server running on port ${port}`);
});