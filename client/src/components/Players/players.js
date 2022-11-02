import React, { useState, useEffect, useRef } from "react";
const Search = React.lazy(() => import('../search'));
const PlayersOwnership = React.lazy(() => import('./playersOwnership'));
const PlayersRankProj = React.lazy(() => import('./playersRank_Proj'));


const PlayerShares = ({ player_shares, weekly_rankings, allplayers, user_id }) => {
    const [playershares, setPlayershares] = useState([])
    const [searched, setSearched] = useState('')
    const [leaguesVisible, setLeaguesVisible] = useState('')
    const [page, setPage] = useState(1)
    const [filterTeam, setFilterTeam] = useState('All')
    const [displayRankings, setDispayRankings] = useState(false)
    const rowRef = useRef(null)

    useEffect(() => {
        setPlayershares(player_shares.sort((a, b) => b.leagues_owned.length - a.leagues_owned.length))

    }, [weekly_rankings])

    useEffect(() => {
        setPage(1)
    }, [searched, player_shares, filterTeam])

    useEffect(() => {
        window.scrollTo({
            top: rowRef.current?.offsetTop,
            left: 0,
            behavior: 'auto'
        })
    }, [page])

    let playershares_display = displayRankings ? weekly_rankings : playershares
    playershares_display = playershares_display.filter(x =>
        (filterTeam === 'All' || allplayers[x.id]?.team === filterTeam) &&
        (searched.trim().length === 0 || allplayers[x.id]?.full_name === searched)
    )

    const display = displayRankings ?
        <PlayersRankProj
            playershares_display={playershares_display}
            playershares={playershares}
            page={page}
            setPage={setPage}
            leaguesVisible={leaguesVisible}
            setLeaguesVisible={setLeaguesVisible}
            rowRef={rowRef}
            user_id={user_id}
            allplayers={allplayers}
            weekly_rankings={weekly_rankings}
        />
        :
        <PlayersOwnership
            playershares_display={playershares_display}
            page={page}
            setPage={setPage}
            leaguesVisible={leaguesVisible}
            setLeaguesVisible={setLeaguesVisible}
            rowRef={rowRef}
            user_id={user_id}
            allplayers={allplayers}
        />

    const nfl_teams = [
        'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
        'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN',
        'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'
    ]

    return <>
        <button
            className={displayRankings ? 'active clickable' : 'clickable'}
            onClick={() => setDispayRankings(true)}
        >
            Rankings/Projections
        </button>
        <button
            className={!displayRankings ? 'active clickable' : 'clickable'}
            onClick={() => setDispayRankings(false)}
        >
            Ownership
        </button>
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
        <div className="page_numbers_wrapper">
            <ol className="page_numbers">
                {Array.from(Array(Math.ceil(playershares_display.length / 25)).keys()).map(key => key + 1).map(page_number =>
                    <li className={page === page_number ? 'active clickable' : 'clickable'} key={page_number} onClick={() => setPage(page_number)}>
                        {page_number}
                    </li>
                )}
            </ol>
        </div>
        <React.Suspense fallback={<>...</>}>
            {display}
        </React.Suspense>
    </>
}

export default React.memo(PlayerShares);