

import React, { useState } from "react";
import { avatar } from "../misc_functions";
const PlayerStartBench = React.lazy(() => import('./playerStartBench'))

const PlayersRankProj = ({ playershares_display, page, setPage, leaguesVisible, setLeaguesVisible, rowRef, user_id, allplayers, sendRankEdit }) => {
    const [edit, setEdit] = useState(false)
    const [inputDefaultValue, setInputDefaultValue] = useState(true)

    const handleEditRank = (e, player_id) => {
        const newRank = parseInt(e.target.value)
        if (newRank > 0 && newRank <= 999) {
            sendRankEdit(player_id, newRank)
        }
        setInputDefaultValue(prevState => !prevState)
    }


    const header = (
        <>
            <tr className="main_header double">
                <th colSpan={3} rowSpan={2}>Player</th>
                <th colSpan={2}>
                    Rank&nbsp;
                    <button
                        className={'clickable'}
                        onClick={() => setEdit(prevState => !prevState)}
                    >
                        Edit
                    </button>
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
                                                                key={inputDefaultValue}
                                                                className={'editRank'}
                                                                defaultValue={allplayers[player.id]?.rank_ecr || 999}
                                                                onBlur={(e) => handleEditRank(e, player.id)}
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