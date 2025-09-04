"use client";

import { useEffect, useState } from "react";

export default function APIShowcasePage() {
  const [matchupData, setMatchupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState("");

  useEffect(() => {
    const fetchMatchup = async () => {
      try {
        setLoading(true);
        const url = selectedWeek ? `/api/fantasy?week=${selectedWeek}` : "/api/fantasy";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch matchup: ${res.status} ${res.statusText}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMatchupData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatchup();
  }, [selectedWeek]);

  // Determine current week based on date
  const currentDate = new Date();
  const currentMatchup = matchupData?.matchups?.find((matchup) => {
    const startDate = new Date(matchup.weekStart);
    const endDate = new Date(matchup.weekEnd);
    return currentDate >= startDate && currentDate <= endDate;
  });

  const hasProjections = matchupData?.matchups?.some(
    (matchup) =>
      parseFloat(matchup.yourTeam.projectedPoints) > 0 ||
      parseFloat(matchup.yourTeam.winProbability) > 0 ||
      matchupData.roster?.some((player) => parseFloat(player.projectedPoints) > 0) ||
      matchup.opponent.roster?.some((player) => parseFloat(player.projectedPoints) > 0)
  );

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Fantasy Football Matchup</h1>
        <p className="mt-2 text-gray-600">
          Preview your weekly fantasy football matchup and rosters for the 2025 season.
        </p>
      </section>

      <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        {/* <div className="flex justify-center mb-6">
          <select
            className="border border-gray-300 rounded-md p-2 text-sm"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            <option value="">Current Week</option>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((week) => (
              <option key={week} value={week}>Week {week}</option>
            ))}
          </select>
        </div> */}

        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {matchupData?.warning && (
          <p className="text-center text-orange-500 mb-6">{matchupData.warning}</p>
        )}

        {matchupData && (
          <div className="space-y-6">
            {(() => {
              const matchupsToDisplay = selectedWeek
                ? matchupData.matchups.filter((m) => m.week === selectedWeek)
                : currentMatchup ? [currentMatchup] : matchupData.matchups;
              return matchupsToDisplay.map((matchup) => (
                <div key={matchup.week} className="space-y-4">
                  <h2 id="name" className="text-2xl font-semibold text-center">
                    Week {matchup.week} ({matchup.weekStart} - {matchup.weekEnd})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 id="name" className="text-lg font-medium mb-2">{matchup.yourTeam.name}</h3>
                      {hasProjections && (
                        <div id="name" className="mb-4">
                          <p><strong>Projected Points:</strong> {matchup.yourTeam.projectedPoints}</p>
                          <p><strong>Win Probability:</strong> {(matchup.yourTeam.winProbability * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      <h4 id="name" className="text-md font-medium mb-2">Roster</h4>
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs uppercase bg-gray-100">
                          <tr>
                            <th className="px-2 py-1">Player</th>
                            <th className="px-2 py-1">Position</th>
                            {hasProjections && (
                              <>
                                <th className="px-2 py-1">Points</th>
                                <th className="px-2 py-1">Proj. Points</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {matchupData.roster.map((player) => (
                            <tr key={player.playerId} className="border-b">
                              <td className="px-2 py-1">{player.name}</td>
                              <td className="px-2 py-1">{player.position}</td>
                              {hasProjections && (
                                <>
                                  <td className="px-2 py-1">{player.points}</td>
                                  <td className="px-2 py-1">{player.projectedPoints}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 id="name" className="text-lg font-medium mb-2">{matchup.opponent.name}</h3>
                      {hasProjections && (
                        <div className="mb-4">
                          <p><strong>Projected Points:</strong> {matchup.opponent.projectedPoints}</p>
                          <p><strong>Win Probability:</strong> {(matchup.opponent.winProbability * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      <h4 id="name" className="text-md font-medium mb-2">Roster</h4>
                      {matchup.opponent.roster?.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-700">
                          <thead className="text-xs uppercase bg-gray-100">
                            <tr>
                              <th className="px-2 py-1">Player</th>
                              <th className="px-2 py-1">Position</th>
                              {hasProjections && (
                                <>
                                  <th className="px-2 py-1">Points</th>
                                  <th className="px-2 py-1">Proj. Points</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {matchup.opponent.roster.map((player) => (
                              <tr key={player.playerId} className="border-b">
                                <td className="px-2 py-1">{player.name}</td>
                                <td className="px-2 py-1">{player.position}</td>
                                {hasProjections && (
                                  <>
                                    <td className="px-2 py-1">{player.points}</td>
                                    <td className="px-2 py-1">{player.projectedPoints}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-red-500">
                          {matchup.opponent.rosterError || "Unable to fetch opponent roster data."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </main>
  );
}