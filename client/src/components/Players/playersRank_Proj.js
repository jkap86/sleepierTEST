

import React, { useState, useEffect, useRef } from "react";
import { avatar } from "../misc_functions";
import { getNewRank } from "../projections_stats";
import { writeFile, utils } from 'xlsx';
const PlayerStartBench = React.lazy(() => import('./playerStartBench'))
const Search = React.lazy(() => import('../search'));

const PlayersRankProj = ({ playershares, allplayers, sendRankEdit }) => {
    const [edit, setEdit] = useState(false)
    const [rankings, setRankings] = useState({})
    const [page, setPage] = useState(1)
    const rowRef = useRef(null)
    const [filterTeam, setFilterTeam] = useState('All')
    const [searched, setSearched] = useState('')

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

    const exportRankings = () => {
        const data = Object.keys(allplayers)
            .filter(id => playershares.find(ps => ps.id === id))
            .map(id => {
                return {
                    rank: allplayers[id].rank_ecr,
                    player: allplayers[id].full_name,
                    position: allplayers[id].position,
                    team: allplayers[id].team || 'FA',
                    opponent: allplayers[id]?.player_opponent
                }
            })
            .sort((a, b) => a.rank - b.rank)
        const worksheet = utils.json_to_sheet(data)
        const workbook = utils.book_new()
        utils.book_append_sheet(workbook, worksheet, "Rankings")
        writeFile(workbook, "SleepierRankings.csv")
    }

    const nfl_teams = [
        'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
        'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN',
        'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
    ]

    const header = (
        <>
            <tr className="main_header double">
                <th colSpan={3}
                    rowSpan={2}
                >
                    <i
                        onClick={() => exportRankings()}
                        className={'fa fa-download clickable left'}
                    >
                    </i>
                    Player
                </th>
                <th colSpan={4}>
                    Weekly Rankings
                </th>
                <th colSpan={2} rowSpan={2}>Opp</th>
            </tr>
            <tr className="main_header double">
                <th colSpan={1}>
                    {
                        edit ?
                            <>
                                <i
                                    onClick={() => setEdit(false)}
                                    className={'fa fa-trash clickable left'}
                                >
                                </i>
                            </>
                            : null
                    }
                    OVR
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
                <th colSpan={1}>Pos</th>
                <th colSpan={1}>Min</th>
                <th colSpan={1}>Max</th>
            </tr>
        </>
    )

    const display = (
        <>
            {
                playershares
                    .filter(x =>
                        (filterTeam === 'All' || allplayers[x.id]?.team === filterTeam) &&
                        ((searched?.trim()?.length || 0) === 0 || allplayers[x.id]?.full_name === searched)
                    )
                    .slice((page - 1) * 25, ((page - 1) * 25) + 25).map((player, index) =>
                        <tbody
                            key={`${player.id}_${index}`}
                        >
                            <tr>
                                <td colSpan={9}>
                                    <table className={`table${1}`}>
                                        <tbody>
                                            <tr
                                                ref={index === 0 ? rowRef : null}
                                                className={'main_row clickable'}
                                            >
                                                <td colSpan={3} className={'left'}>
                                                    <p>
                                                        {
                                                            avatar(player.id, allplayers[player.id]?.full_name, 'player')
                                                        }
                                                        {allplayers[player.id]?.position || player.id}&nbsp;
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
                                                            allplayers[player.id]?.rank_ecr === 1000 ? 'BYE' : allplayers[player.id]?.rank_ecr || 999
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
                                                <td>{allplayers[player.id]?.rank_min}</td>
                                                <td>{allplayers[player.id]?.rank_max}</td>
                                                <td colSpan={2}>{allplayers[player.id]?.player_opponent || '-'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    )
            }
            {
                (((page - 1) * 25) + 25) < playershares.length ?
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
        <span className="team">
            <label>
                Team
            </label>
            <select onChange={(e) => setFilterTeam(e.target.value)}>
                <option>All</option>
                {nfl_teams.map(team =>
                    <React.Fragment key={team}>
                        <option>{team}</option>
                    </React.Fragment>
                )}
            </select>
        </span>
        <React.Suspense fallback={<>...</>}>
            <Search
                list={playershares.map(player => allplayers[player.id]?.full_name)}
                placeholder={'Search Players'}
                sendSearched={(data) => setSearched(data)}
            />
        </React.Suspense>
        <span className="team">
            <label>
                Position
            </label>
            <select>
                <option>QB</option>
                <option>RB</option>
                <option>WR</option>
                <option>TE</option>
            </select>
        </span>
        <div className="page_numbers_wrapper">
            <ol className="page_numbers">
                {Array.from(Array(Math.ceil(playershares.length / 25)).keys()).map(key => key + 1).map(page_number =>
                    <li className={page === page_number ? 'active clickable' : 'clickable'} key={page_number} onClick={() => setPage(page_number)}>
                        {page_number}
                    </li>
                )}
            </ol>
        </div>
        <div className={`nav1`}>
            <button
                className={'active clickable'}
            >
                Rankings
            </button>
        </div>
        <table className="main">
            <thead className="main">
                {header}
            </thead>
            {display}
        </table>
    </>
}
export default PlayersRankProj;