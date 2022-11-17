

const getLeagueSync = async (axios, league_id, user_id) => {
    const [league, rosters, users] = await Promise.all([
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}`),
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/rosters`),
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/users`)
    ])
    rosters.data
        .sort((a, b) => b.settings.fpts - a.settings.fpts)
        .map((roster, index) => {
            roster['rank_points'] = index + 1
            return roster
        })

    const standings = (
        rosters.data
            .sort((a, b) => b.settings.wins - a.settings.wins || a.settings.losses - b.settings.losses ||
                b.settings.fpts - a.settings.fpts)
            .map((roster, index) => {
                roster['rank'] = index + 1
                return roster
            })
    )

    const userRoster = standings.find(r => r.owner_id === user_id || r.co_owners?.includes(user_id))

    if (userRoster?.players) {
        return {
            ...league.data,
            rosters: rosters.data,
            users: users.data,
            userRoster: userRoster,
            standings: standings
        }
    }

}

module.exports = {
    getLeagueSync: getLeagueSync
}