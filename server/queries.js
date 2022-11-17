

const updateUser = async (db, user, leagues, season) => {
    const now = new Date()
    console.log(now)
    let user_leagues = JSON.stringify(leagues.map(leagues => leagues.league_id))
    const result = await db.query(
        `INSERT INTO users (
            user_id,
            username,
            avatar,
            leagues_${season}, 
            updated
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE
            SET username=$2,
            avatar=$3,
            leagues_${season}=$4,
            updated=$5`,
        [user.user_id, user.display_name, user.avatar, user_leagues, now]
    );
    return 'Successful'
}

const getLeagues = async (axios, db, leagues, season, user_id) => {
    const now = new Date()
    let to_updated_league_ids = leagues.map(league => league.league_id)
    const db_leagues = await db.query(`SELECT * FROM leagues_${season} WHERE league_id = ANY($1)`, [to_updated_league_ids])
    console.log(db_leagues.rows.length)
    let current_leagues = db_leagues.rows.map(league => {
        return {
            ...league,
            index: leagues.findIndex(obj => {
                return obj.league_id === league.league_id
            })
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
        await db.query(`INSERT INTO leagues_${season} (
                league_id,
                name,
                avatar,
                best_ball,
                type,
                scoring_settings,
                roster_positions,
                users,
                rosters,
                updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [league.league_id, league.name, league.avatar, league.settings.best_ball, league.settings.type, JSON.stringify(league.scoring_settings), JSON.stringify(league.roster_positions), JSON.stringify(users.data), JSON.stringify(rosters.data), now]
        );

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
            .filter(league => league.userRoster?.players)
    )
}

const syncLeague = async (db, league, season) => {
    const now = new Date()
    const result = await db.query(
        `INSERT INTO leagues_${season} (
            league_id,
            name,
            avatar,
            best_ball, 
            type, 
            scoring_settings, 
            roster_positions, 
            users, 
            rosters, 
            updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (league_id) DO UPDATE
            SET name=$2,
            avatar=$3,
            best_ball=$4,
            type=$5,
            scoring_settings=$6, 
            roster_positions=$7, 
            users=$8, 
            rosters=$9, 
            updated=$10
            `,
        [league.league_id, league.name, league.avatar, league.settings.best_ball, league.settings.type, JSON.stringify(league.scoring_settings), JSON.stringify(league.roster_positions), JSON.stringify(league.users), JSON.stringify(league.rosters), now]
    )
    console.log(result)
    return result
}

const updateAllLeagues = async (axios, db, season) => {
    const now = new Date()
    const leagues_to_update = await db.query(`SELECT * FROM leagues_${season} WHERE updated + INTERVAL '15 min' < $1`, [now])
    await Promise.all(leagues_to_update.rows.map(async league => {
        const [users, rosters] = await Promise.all([
            await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/users`),
            await axios.get(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`)
        ])
        await db.query(`INSERT INTO leagues_${season} (
                league_id,
                name,
                avatar,
                best_ball,
                type,
                scoring_settings,
                roster_positions,
                users,
                rosters,
                updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (league_id) DO UPDATE SET
                name=$2,
                avatar=$3,
                best_ball=$4,
                type=$5,
                scoring_settings=$6,
                roster_positions=$7,
                users=$8,
                rosters=$9,
                updated=$10
            `,
            [league.league_id, league.name, league.avatar, league.best_ball, league.type, JSON.stringify(league.scoring_settings), JSON.stringify(league.roster_positions), JSON.stringify(users.data), JSON.stringify(rosters.data), now]
        );
    }))
    return leagues_to_update.rows
}

module.exports = {
    updateUser: updateUser,
    getLeagues: getLeagues,
    syncLeague: syncLeague,
    updateAllLeagues: updateAllLeagues
}