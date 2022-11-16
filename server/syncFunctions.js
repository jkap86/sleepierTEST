const cheerio = require('cheerio')

const getWeeklyRankings = async (axios) => {
    const html_sf = await axios.get('https://www.fantasypros.com/nfl/rankings/ppr-superflex.php')

    let script = []
    let $ = cheerio.load(html_sf.data)
    const header = $('.rankings-page__heading').text()
    const week = header.match(/(?<=Week )[0-9]+(?= \()/g)
    $('script').each((i, elem) => {
        if ($(elem).text().includes("var ecrData")) {
            script.push({
                index: i,
                text: $(elem).text()
            })
        }
    })


    let rankings = script[0].text.substring(
        script[0].text.indexOf('[') + 1,
        script[0].text.indexOf(']')
    )
        .replace(/},{/g, "}-----{")
        .split('-----')

    let rankings_parsed = rankings.map(rank => {
        let parsed = JSON.parse(rank)
        parsed['week'] = week[0]
        return parsed
    })

    return rankings_parsed
}

const match_weekly_rankings = (weekly_rankings, allplayers, schedule) => {
    const week = weekly_rankings.find(w_r => w_r.week).week
    const teams_playing = Array.from(new Set(weekly_rankings.map(w_r => w_r.player_team_id)))
    weekly_rankings.map(fp_id => {
        const searchName = (
            fp_id.player_name
                .split(' ')
                .filter(x => !['V', 'III', 'II', 'Sr.', 'Jr.'].includes(x))
                .join('')
                .replace("'", "")
                .replace('-', '')
                .replace('.', '')
                .toLowerCase()
                .replace(/[^a-zA-Z ]/g, "")
                .trim()
        )
        const match_id = Object.keys(allplayers).find(x =>
            (
                allplayers[x].yahoo_id === parseInt(fp_id.player_yahoo_id) &&
                allplayers[x].search_full_name.replace(/[^a-zA-Z ]/g, "").trim() === searchName
            )
            ||
            (
                (
                    (allplayers[x].position === fp_id.player_position_id ||
                        ['RB', 'TE'].includes(fp_id.player_position_id) && allplayers[x].position === 'FB')
                )
                &&
                (allplayers[x].search_full_name.trim() === searchName)
                &&
                (
                    allplayers[x].team === fp_id.player_team_id ||
                    allplayers[x].team?.slice(0, 2) === fp_id.player_team_id.slice(0, 2)
                )
            )
        )

        if (match_id) {
            const gametime = schedule.find(s =>
                s.Week === parseInt(fp_id.week) &&
                ([s.AwayTeam, s.HomeTeam].includes(fp_id.player_team_id.replace('JAC', 'JAX')) && ![s.AwayTeam, s.HomeTeam].includes('BYE'))
            )?.Date

            let gametime_date;
            let day;
            let hour;
            let time;
            if (gametime) {
                gametime_date = new Date(gametime)
                day = gametime_date.getDay()
                hour = gametime_date.getHours()
                time = gametime_date.getTime()
            }

            allplayers[match_id] = {
                ...allplayers[match_id],
                ...fp_id,
                gametime: (day === undefined || hour === undefined ? 99.99 :
                    parseFloat(`${day < 4 ? day + 7 : day}.${hour.toLocaleString("en-US", { minimumIntegerDigits: 2 })}`)
                ),
                gametime_day: day || 99,
                gametime_hour: hour || 99,
                gametime_time: time
            }
        } else {
            console.log(`${fp_id.player_name} NOT MATCHED!!!`)
        }
    })
    Object.keys(allplayers).filter(id => !allplayers[id].rank_ecr).map(id => {
        allplayers[id].rank_ecr = !allplayers[id].team || teams_playing.includes(allplayers[id].team) ? 999 : 1000
        allplayers[id].week = week
    })
    return (allplayers)
}

module.exports = {
    getWeeklyRankings: getWeeklyRankings,
    match_weekly_rankings: match_weekly_rankings
}