

const updateUser = async (query, user, leagues, season) => {
    const now = Date.now().toString()
    let user_leagues = JSON.stringify(leagues.map(leagues => leagues.league_id))
    await query(`REPLACE INTO users (user_id, username, avatar, leagues_${season}, updated) VALUES (?, ?, ?, ?, ?)`,
        [user.user_id, user.display_name, user.avatar, user_leagues, now]
    );
    return 'Successful'
}

const updateLeagues = async (axios, query, leagues, season, user_id) => {
    const now = Date.now().toString()
    let to_updated_league_ids = leagues.map(league => league.league_id)
    let current_leagues = await query(`SELECT * FROM leagues_${season}`)
    current_leagues = current_leagues.filter(league => to_updated_league_ids.includes(league.league_id))

    current_leagues = current_leagues.map(cl => {
        return {
            ...cl,
            index: leagues.findIndex(obj => {
                return obj.league_id === cl.league_id
            }),
            scoring_settings: JSON.parse(cl.scoring_settings),
            roster_positions: JSON.parse(cl.roster_positions),
            rosters: JSON.parse(cl.rosters),
            users: JSON.parse(cl.users)
        }
    })
    let current_league_ids = current_leagues.map(league => league.league_id)

    await Promise.all(leagues.filter(league => !current_league_ids.includes(league.league_id)).map(async league => {
        const [users, rosters] = await Promise.all([
            await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/users`),
            await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`)
        ])

        current_leagues.push({
            index: leagues.findIndex(obj => {
                return obj.league_id === league.league_id
            }),
            league_id: league.league_id,
            name: league.name,
            avatar: league.avatar,
            best_ball: league.settings.best_ball,
            type: league.settings.type,
            scoring_settings: league.scoring_settings,
            roster_positions: league.roster_positions,
            users: users.data,
            rosters: rosters.data,
            updated: now

        })
        await query(`REPLACE INTO leagues_${season} (league_id, name, avatar, best_ball, type, scoring_settings, roster_positions, users, rosters, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [league.league_id, league.name, league.avatar, league.settings.best_ball, league.settings.type, JSON.stringify(league.scoring_settings), JSON.stringify(league.roster_positions), JSON.stringify(users.data), JSON.stringify(rosters.data), now]
        );
        console.log('leagues updated')

    }))

    return (
        current_leagues
            .map(league => {
                league.rosters
                    ?.sort((a, b) => b.settings.fpts - a.settings.fpts)
                    ?.map((roster, index) => {
                        roster['rank_points'] = index + 1
                        return roster
                    })

                const standings = (
                    league.rosters
                        ?.sort((a, b) => b.settings.wins - a.settings.wins || a.settings.losses - b.settings.losses ||
                            b.settings.fpts - a.settings.fpts)
                        ?.map((roster, index) => {
                            roster['rank'] = index + 1
                            return roster
                        })
                )
                const userRoster = standings?.find(r => r.owner_id === user_id || r.co_owners?.includes(user_id))
                return {
                    ...league,
                    userRoster: userRoster
                }
            })
            .filter(league => league.userRoster)
    )
}

module.exports = {
    updateUser: updateUser,
    updateLeagues: updateLeagues
}