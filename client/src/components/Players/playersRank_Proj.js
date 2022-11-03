

import React, { useState, useEffect } from "react";
import { avatar } from "../misc_functions";
import { getNewRank } from "../projections_stats";
const PlayerStartBench = React.lazy(() => import('./playerStartBench'))

const PlayersRankProj = ({ playershares_display, page, setPage, leaguesVisible, setLeaguesVisible, rowRef, user_id, allplayers, sendRankEdit }) => {
    const [edit, setEdit] = useState(false)
    const [rankingEdits, setRankingEdits] = useState({})
    const [rankings, setRankings] = useState({})

    useEffect(() => {
        setRankings(allplayers)
    }, [allplayers])

    const handleRankChange = (e, player_id) => {
        let r = rankings
        const prevRank = rankings[player_id].rank_ecr
        const newRank = e.target.value
        Object.keys(rankings)
            .map((player, index) => {
                let incrementedRank = rankings[player].rank_ecr
                incrementedRank = getNewRank(rankings, prevRank, newRank, player_id, player, incrementedRank)
                rankings[player].rank_ecr = incrementedRank
            })
        setRankings({ ...r })
    }

    const handleRankSave = () => {
        const r = rankings
        sendRankEdit(r)
        setEdit(false)
    }

    /*
    const saveRankEdits = () => {
        let changes = rankingEdits
        sendRankEdit(changes)
        setEdit(false)
        setRankingEdits({})
    }

    const handleEditRank = (e, player_id) => {
        let changes = rankingEdits
        const newRank = parseInt(e.target.value)
        const prevRank = allplayers[player_id].rank_ecr
        if (newRank > 0 && newRank <= 999) {
            changes[player_id] = {
                prevRank: prevRank,
                newRank: newRank
            }
        }
        setRankingEdits(changes)
    }

    const previewRank = (player) => {
        const changes = rankingEdits
        let incrementedRank = allplayers[player].rank_ecr
        Object.keys(changes).map(change_id => {
            incrementedRank = getNewRank(allplayers, changes[change_id].prevRank, changes[change_id].newRank, change_id, player, incrementedRank)
        })
        return incrementedRank

    }
*/
    const header = (
        <>
            <tr className="main_header double">
                <th colSpan={3} rowSpan={2}>Player</th>
                <th colSpan={2}>
                    {
                        edit ?
                            <>
                                <i
                                    onClick={() => setEdit(false)}
                                    className={'fa fa-times clickable left'}
                                >
                                </i>
                            </>
                            : null
                    }
                    Rank
                    {
                        edit ?
                            <>
                                <i
                                    onClick={() => handleRankSave()}
                                    className={'fa fa-save clickable right'}
                                >
                                </i>
                            </>
                            :
                            <i
                                onClick={() => setEdit(true)}
                                className={'fa fa-edit clickable right'}
                            >
                            </i>
                    }
                </th>
                <th colSpan={2} rowSpan={2}>Opp</th>
                <th colSpan={1} rowSpan={2}>Start</th>
                <th colSpan={1} rowSpan={2}>Bench</th>
            </tr>
            <tr className="main_header double">
                <th colSpan={1}>OVR</th>
                <th colSpan={1}>Pos</th>
            </tr>
        </>
    )

    const display = (
        <>
            {
                playershares_display
                    .slice((page - 1) * 25, ((page - 1) * 25) + 25).map((player, index) =>
                        <tbody
                            key={`${player.id}_${index}`}
                            className={leaguesVisible === player.id ? 'active' : null}
                        >
                            <tr>
                                <td colSpan={9}>
                                    <table className={`table${1}`}>
                                        <tbody>
                                            <tr
                                                ref={index === 0 ? rowRef : null}
                                                className={leaguesVisible === player.id ? 'main_row active clickable' : 'main_row clickable'}
                                                onClick={edit ? null : () => setLeaguesVisible(prevState => prevState === player.id ? '' : player.id)}
                                            >
                                                <td colSpan={3} className={'left'}>
                                                    <p>
                                                        {
                                                            avatar(player.id, allplayers[player.id]?.full_name, 'player')
                                                        }
                                                        {allplayers[player.id]?.position}&nbsp;
                                                        {allplayers[player.id]?.full_name || player.player_name}&nbsp;
                                                        {allplayers[player.id]?.team}
                                                    </p>
                                                </td>
                                                <td colSpan={1}>
                                                    {
                                                        edit ?
                                                            <input
                                                                className={'editRank'}
                                                                value={rankings[player.id]?.rank_ecr}
                                                                onChange={(e) => handleRankChange(e, player.id)}
                                                            />
                                                            :
                                                            allplayers[player.id]?.rank_ecr || 999
                                                    }
                                                </td>
                                                <td colSpan={1}>
                                                    {allplayers[player.id]?.position === 'FB' ? 'RB' : allplayers[player.id]?.position}
                                                    {

                                                        (Object.keys(allplayers)
                                                            .filter(ap =>
                                                                allplayers[ap].position === allplayers[player.id]?.position ||
                                                                (allplayers[player.id]?.position === 'FB' && ['FB', 'RB'].includes(allplayers[ap].position))
                                                            )
                                                            .sort((a, b) => (allplayers[a].rank_ecr || 999) - (allplayers[b].rank_ecr || 999))
                                                            .indexOf(player.id) + 1)
                                                    }
                                                </td>
                                                <td colSpan={2}>{allplayers[player.id]?.player_opponent || '-'}</td>
                                                <td colSpan={1}>
                                                    {
                                                        player.leagues_owned.filter(lo => lo.status === 'Starter').length
                                                    }
                                                </td>
                                                <td colSpan={1}>
                                                    {
                                                        player.leagues_owned.filter(lo => lo.status !== 'Starter').length
                                                    }
                                                </td>
                                            </tr>
                                            {
                                                leaguesVisible !== player.id ? null :
                                                    <tr>
                                                        <td colSpan={9}>
                                                            <React.Suspense fallback={
                                                                <div className='logo_wrapper'>
                                                                    <div className='z one'>Z</div>
                                                                    <div className='z two'>Z</div>
                                                                    <div className='z three'>Z</div>
                                                                </div>}>
                                                                <PlayerStartBench
                                                                    type={2}
                                                                    player_id={player.id}
                                                                    leagues_starting={player.leagues_owned.filter(lo => lo.status === 'Starter')}
                                                                    leagues_benched={player.leagues_owned.filter(lo => lo.status !== 'Starter')}
                                                                    user_id={user_id}
                                                                    player_rank={player.rank_ecr}
                                                                    allplayers={allplayers}
                                                                />
                                                            </React.Suspense>
                                                        </td>
                                                    </tr>
                                            }
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    )
            }
            {
                (((page - 1) * 25) + 25) < playershares_display.length ?
                    <tbody>
                        <tr
                            className={'clickable'}
                            onClick={() => setPage(prevState => prevState + 1)}
                        >
                            <td colSpan={9}>NEXT PAGE</td>
                        </tr>
                    </tbody>
                    :
                    null
            }
        </>
    )

    return <>
        <table className="main">
            <thead className="main">
                {header}
            </thead>
            {display}
        </table>
    </>
}
export default PlayersRankProj;