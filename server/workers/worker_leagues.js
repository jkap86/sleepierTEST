const express = require('express')
const router = express.Router()
const axios = require('axios')

const getLeagueInfo = async (leagues, user_id) => {
    let leagues_detailed = []
    await Promise.all(leagues.map(async (league, index) => {
        const [rosters, users] = await Promise.all([
            await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`),
            await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/users`)
        ])
        const userRoster = rosters.data.find(r => r.owner_id === user_id || r.co_owners?.includes(user_id))
        if (userRoster && userRoster.players) {
            leagues_detailed.push({
                ...league,
                index: index,
                rosters: rosters.data,
                users: users.data,
                userRoster: userRoster
            })
        }
    }))


    return leagues_detailed
}

router.get('/leagues', async (req, res) => {
    const user_id = req.query.user_id
    const leagues = await axios.get(`https://api.sleeper.app/v1/user/${user_id}/leagues/nfl/2022`)
    const leagues_detailed = await getLeagueInfo(leagues.data, user_id)
    res.send({
        leagues: leagues_detailed
    })
})

module.exports = router