
export const match_weekly_rankings = async (weekly_rankings, allplayers) => {
    const activePlayers = Object.keys(allplayers)
        .filter(x =>
            (['QB', 'RB', 'FB', 'WR', 'TE'].includes(allplayers[x].position))
        )

    const matched_rankings = Object.keys(weekly_rankings).map(fp_id => {
        const searchName = (
            weekly_rankings[fp_id].player_name
                .split(' ')
                .filter(x => !['V', 'III', 'II', 'Sr.', 'Jr.'].includes(x))
                .join('')
                .replace("'", "")
                .replace('-', '')
                .replace('.', '')
                .toLowerCase()
        )
        const match_id = activePlayers.find(x =>
            (allplayers[x].yahoo_id === parseInt(weekly_rankings[fp_id].player_yahoo_id)) ||
            (
                (
                    (allplayers[x].position === weekly_rankings[fp_id].player_position_id ||
                        ['RB', 'TE'].includes(weekly_rankings[fp_id].player_position_id) && allplayers[x].position === 'FB')
                )
                &&
                (allplayers[x].search_full_name.trim() === searchName)
                &&
                (
                    allplayers[x].team === weekly_rankings[fp_id].player_team_id ||
                    allplayers[x].team?.slice(0, 2) === weekly_rankings[fp_id].player_team_id.slice(0, 2)
                )
            )
        )
        return {
            ...weekly_rankings[fp_id],
            id: match_id || 0,
            searchName: searchName
        }
    })
    return (matched_rankings.sort((a, b) => a.rank_ecr - b.rank_ecr))
}


export const getLineupCheck = (roster_positions, roster, weekly_rankings, allplayers) => {
    const position_map = {
        'QB': ['QB'],
        'RB': ['RB', 'FB'],
        'WR': ['WR'],
        'TE': ['TE'],
        'FLEX': ['RB', 'FB', 'WR', 'TE'],
        'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
        'WRRB_FLEX': ['RB', 'FB', 'WR'],
        'REC_FLEX': ['WR', 'TE']
    }

    const starting_slots = roster_positions.filter(x => Object.keys(position_map).includes(x))

    let optimal_lineup = []
    starting_slots.map((slot, index) => {
        const cur_rank = weekly_rankings.find(x => x.id === roster.starters[index])?.rank_ecr || 999
        const cur_pos_rank = weekly_rankings.find(x => x.id === roster.starters[index])?.pos_rank
        const subs = roster.players.filter(p =>
            !(roster.starters?.includes(p)) &&
            position_map[slot].includes(allplayers[p]?.position) &&
            weekly_rankings.find(w_r => w_r.id === p)?.rank_ecr < cur_rank
        )
        optimal_lineup.push({
            index: index,
            slot: slot,
            cur_id: roster.starters[index],
            cur_rank: cur_rank,
            cur_pos_rank: cur_pos_rank,
            subs: subs
        })
    })


    return optimal_lineup
}

export const getStartedOver = (player_id, roster, roster_positions, weekly_rankings, allplayers, player_rank) => {
    const position_map = {
        'QB': ['QB'],
        'RB': ['RB', 'FB'],
        'WR': ['WR'],
        'TE': ['TE'],
        'FLEX': ['RB', 'FB', 'WR', 'TE'],
        'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
        'WRRB_FLEX': ['RB', 'FB', 'WR'],
        'REC_FLEX': ['WR', 'TE']
    }

    const slot = roster_positions[roster.starters.indexOf(player_id)]

    const subs = roster.players.filter(p =>
        !roster.starters.includes(p) &&
        position_map[slot].includes(allplayers[p].position) &&
        weekly_rankings.find(w_r => w_r.id === p)?.rank_ecr < player_rank
    )

    return subs.length > 0 ? subs : null
}

export const getBenchedOver = (player_id, roster, roster_positions, weekly_rankings, allplayers, player_rank) => {
    const position_map = {
        'QB': ['QB'],
        'RB': ['RB', 'FB'],
        'WR': ['WR'],
        'TE': ['TE'],
        'FLEX': ['RB', 'FB', 'WR', 'TE'],
        'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
        'WRRB_FLEX': ['RB', 'FB', 'WR'],
        'REC_FLEX': ['WR', 'TE']
    }

    const slots = roster_positions.map((slot, index) => {
        const rank = weekly_rankings.find(w_r => w_r.id === roster.starters[index])
        const rank_ovr = rank?.rank_ecr
        const rank_pos = rank?.pos_rank
        return {
            slot: slot.replace('SUPER_FLEX', 'SF').replace('FLEX', 'WRT'),
            starter: roster.starters[index],
            rank: rank_ovr,
            rank_pos: rank_pos
        }
    }).filter((slot, index) => {
        return (
            position_map[slot.slot]?.includes(allplayers[player_id]?.position) &&
            slot.rank > player_rank
        )
    })

    return slots.length > 0 ? slots : null

}