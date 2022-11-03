
export const match_weekly_rankings = async (weekly_rankings, allplayers) => {
    const activePlayers = Object.keys(allplayers)
        .filter(x =>
            (['QB', 'RB', 'FB', 'WR', 'TE'].includes(allplayers[x].position))
        )


    Object.keys(weekly_rankings).map(fp_id => {
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
        allplayers[match_id] = {
            ...allplayers[match_id],
            ...weekly_rankings[fp_id]
        }
    })
    Object.keys(allplayers).filter(id => !allplayers[id].rank_ecr).map(id => {
        allplayers[id].rank_ecr = 999
    })
    return (allplayers)
}

export const getNewRank = (rankings, prevRank, newRank, player_id, playerToIncrement, playerToIncrementRank) => {
    let incrementedRank = playerToIncrementRank
    if (playerToIncrement === player_id) {
        incrementedRank = newRank
    } else {
        if (rankings[playerToIncrement].rank_ecr > prevRank) {
            incrementedRank = rankings[playerToIncrement].rank_ecr - 1
        }
        if (incrementedRank >= newRank) {
            incrementedRank = incrementedRank + 1
        }
    }
    return incrementedRank
}

export const getLineupCheck = (roster_positions, roster, allplayers) => {
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

    let player_ranks = roster.players.map(player => {
        return {
            id: player,
            rank: allplayers[player]?.rank_ecr,
            rank_pos: allplayers[player]?.pos_rank
        }
    })

    let optimal_lineup = []
    starting_slots.map((slot, index) => {
        const slot_options = player_ranks
            .filter(p => position_map[slot].includes(allplayers[p.id]?.position))
            .sort((a, b) => (a.rank || 999) - (b.rank || 999))

        const optimal_player = slot_options[0].id
        player_ranks = player_ranks.filter(p => p.id !== optimal_player)
        optimal_lineup.push(optimal_player)
    })

    let lineup_check = []
    starting_slots.map((slot, index) => {
        const cur_id = roster.starters[index]
        const cur_matched = allplayers[cur_id]
        const cur_rank = cur_matched?.rank_ecr
        const cur_pos_rank = cur_matched?.pos_rank
        const subs = roster.players.filter(p =>
            !roster.starters.includes(p) && !roster.taxi?.includes(p) &&
            position_map[slot].includes(allplayers[p]?.position) &&
            (allplayers[p]?.rank_ecr || 999) < (cur_rank || 999)
        )
        const subs_taxi = roster.taxi?.filter(p =>
            roster.taxi?.includes(p) &&
            position_map[slot].includes(allplayers[p]?.position) &&
            (allplayers[p]?.rank_ecr || 999) < (cur_rank || 999)
        )

        lineup_check.push({
            index: index,
            slot: slot,
            cur_id: cur_id,
            cur_rank: cur_rank,
            cur_pos_rank: cur_pos_rank,
            subs: subs,
            subs_taxi: subs_taxi
        })
    })



    return lineup_check
}

export const getStartedOver = (player_id, roster, roster_positions, allplayers, player_rank) => {
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
        allplayers[p]?.rank_ecr < player_rank
    )

    return subs.length > 0 ? subs : null
}

export const getBenchedOver = (player_id, roster, roster_positions, allplayers, player_rank) => {
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
        const rank = allplayers[roster.starters[index]]
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