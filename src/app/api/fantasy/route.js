import { getAccessToken } from "@/utils/yahooAuth";

export async function GET(request) {
  try {
    const token = await getAccessToken();

    // Step 1: Fetch current NFL game key
    const gameResponse = await fetch(
      "https://fantasysports.yahooapis.com/fantasy/v2/game/nfl?format=json",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!gameResponse.ok) {
      throw new Error(`Failed to fetch game key: ${gameResponse.status} ${gameResponse.statusText}`);
    }
    const gameData = await gameResponse.json();
    const gameKey = gameData.fantasy_content.game?.[0]?.game_key;
    if (!gameKey) {
      throw new Error("Game key not found in response");
    }

    // Step 2: Fetch user's active leagues with teams
    const leaguesResponse = await fetch(
      `https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=${gameKey}/leagues;out=teams?format=json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!leaguesResponse.ok) {
      throw new Error(`Failed to fetch leagues: ${leaguesResponse.status} ${leaguesResponse.statusText}`);
    }
    const leaguesData = await leaguesResponse.json();
    console.log("Leagues Data:", JSON.stringify(leaguesData.fantasy_content, null, 2));

    // Step 3: Find team key for league 853029, team ID 5 and collect all team keys
    const games = leaguesData.fantasy_content.users?.[0]?.user?.[1]?.games;
    if (!games) {
      throw new Error("Games data not found in response");
    }

    let teamKey = null;
    const leagueTeamKeys = {};
    let leagueFound = false;
    for (const gameIndex in games) {
      const game = games[gameIndex]?.game;
      if (!game || !Array.isArray(game)) {
        console.log(`Game at index ${gameIndex} is invalid:`, game);
        continue;
      }

      const gameData = game[1];
      if (!gameData?.leagues) {
        console.log(`No leagues found for game at index ${gameIndex}:`, gameData);
        continue;
      }

      const leagues = gameData.leagues;
      for (const leagueIndex in leagues) {
        const leagueArray = leagues[leagueIndex]?.league;
        if (!leagueArray || !Array.isArray(leagueArray)) {
          console.log(`Invalid league at index ${leagueIndex}:`, leagues[leagueIndex]);
          continue;
        }

        const leagueMetadata = leagueArray[0];
        const leagueSubresources = leagueArray[1] || {};
        if (!leagueMetadata?.league_id) {
          console.log(`No league_id found at index ${leagueIndex}:`, leagueMetadata);
          continue;
        }

        if (leagueMetadata.league_id === "853029") {
          leagueFound = true;
          const teams = leagueSubresources.teams;
          if (!teams) {
            console.log(`No teams found for league ${leagueMetadata.league_id}:`, leagueSubresources);
            continue;
          }

          for (const teamIndex in teams) {
            if (teamIndex === "count") continue; // Skip count index
            const team = teams[teamIndex]?.team?.[0];
            if (!team) {
              console.log(`Invalid team at index ${teamIndex}:`, teams[teamIndex]);
              continue;
            }
            const teamId = team.find(item => item.team_id)?.team_id;
            const teamKeyValue = team.find(item => item.team_key)?.team_key;
            const teamName = team.find(item => item.name)?.name;
            if (!teamId || !teamKeyValue) {
              console.log(`Missing teamId or teamKey for team at index ${teamIndex}:`, team);
              continue;
            }
            leagueTeamKeys[teamId] = { teamKey: teamKeyValue, teamName };
            if (teamId === "5") {
              teamKey = teamKeyValue;
              console.log(`Found team: ${teamName} with team_key: ${teamKey}`);
            }
          }
          break;
        }
      }
      if (teamKey && leagueFound) break;
    }

    if (!teamKey) {
      throw new Error("Could not find team with ID 5 in league 853029. Ensure the league is renewed, active, and your team ID is correct.");
    }
    if (!leagueFound) {
      console.log("League 853029 not found in user’s games. Attempting direct league teams fetch.");
      const teamsResponse = await fetch(
        `https://fantasysports.yahooapis.com/fantasy/v2/league/461.l.853029/teams?format=json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch league teams: ${teamsResponse.status} ${teamsResponse.statusText}`);
      }
      const teamsData = await teamsResponse.json();
      console.log("League Teams Data:", JSON.stringify(teamsData.fantasy_content, null, 2));
      const teams = teamsData.fantasy_content.league?.[1]?.teams;
      if (!teams) {
        throw new Error("No teams found in league 853029");
      }
      for (const teamIndex in teams) {
        if (teamIndex === "count") continue;
        const team = teams[teamIndex]?.team?.[0];
        if (!team) {
          console.log(`Invalid team at index ${teamIndex}:`, teams[teamIndex]);
          continue;
        }
        const teamId = team.find(item => item.team_id)?.team_id;
        const teamKeyValue = team.find(item => item.team_key)?.team_key;
        const teamName = team.find(item => item.name)?.name;
        if (!teamId || !teamKeyValue) {
          console.log(`Missing teamId or teamKey for team at index ${teamIndex}:`, team);
          continue;
        }
        leagueTeamKeys[teamId] = { teamKey: teamKeyValue, teamName };
        if (teamId === "5") {
          teamKey = teamKeyValue;
          console.log(`Found team: ${teamName} with team_key: ${teamKey}`);
        }
      }
    }
    console.log("League Team Keys:", JSON.stringify(leagueTeamKeys, null, 2));

    // Step 4: Fetch matchups for the team
    const url = new URL(request.url);
    const week = url.searchParams.get("week");
    const matchupsUrl = week
      ? `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/matchups;week=${week}?format=json`
      : `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/matchups?format=json`;

    const matchupsResponse = await fetch(matchupsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!matchupsResponse.ok) {
      throw new Error(`Failed to fetch matchups: ${matchupsResponse.status} ${matchupsResponse.statusText}`);
    }
    const matchupsData = await matchupsResponse.json();
    console.log("Matchups Data:", JSON.stringify(matchupsData.fantasy_content, null, 2));

    // Step 5: Fetch your team's roster with player stats
    const rosterUrl = week
      ? `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/roster;week=${week}/players;out=stats?format=json`
      : `https://fantasysports.yahooapis.com/fantasy/v2/team/${teamKey}/roster/players;out=stats?format=json`;

    const rosterResponse = await fetch(rosterUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!rosterResponse.ok) {
      throw new Error(`Failed to fetch roster: ${rosterResponse.status} ${rosterResponse.statusText}`);
    }
    const rosterData = await rosterResponse.json();
    console.log("Roster Data:", JSON.stringify(rosterData.fantasy_content, null, 2));

    // Step 6: Process matchups and fetch opponent rosters
    const matchups = matchupsData.fantasy_content.team?.[1]?.matchups;
    if (!matchups) {
      throw new Error("No matchups found in response");
    }

    const simplifiedMatchups = [];
    let hasProjectedData = false;
    for (const matchupIndex in matchups) {
      if (matchupIndex === "count") continue;
      const matchup = matchups[matchupIndex].matchup;
      const teams = matchup[0].teams;
      const week = matchup.week;
      const weekStart = matchup.week_start;
      const weekEnd = matchup.week_end;
      const status = matchup.status;

      let yourTeam = null;
      let opponent = null;
      for (const teamIndex in teams) {
        if (teamIndex === "count") continue;
        const team = teams[teamIndex]?.team?.[0];
        if (!team) {
          console.log(`Invalid team at index ${teamIndex} in matchup ${matchupIndex}:`, teams[teamIndex]);
          continue;
        }
        const teamId = team.find(item => item.team_id)?.team_id;
        const teamName = team.find(item => item.name)?.name;
        const points = teams[teamIndex]?.team_points?.total ?? "0.00";
        const projectedPoints = teams[teamIndex]?.team_projected_points?.total ?? "0.00";
        const winProbability = teams[teamIndex]?.win_probability ?? 0;

        if (parseFloat(projectedPoints) > 0 || parseFloat(winProbability) > 0) {
          hasProjectedData = true;
        }

        const teamData = {
          teamId,
          name: teamName,
          points,
          projectedPoints,
          winProbability,
          teamKey: leagueTeamKeys[teamId]?.teamKey || null,
        };

        if (teamId === "5") {
          yourTeam = teamData;
        } else {
          opponent = teamData;
        }
      }

      if (yourTeam && opponent) {
        // Fetch opponent roster if teamKey is available
        let opponentRoster = [];
        if (opponent.teamKey) {
          const opponentRosterUrl = week
            ? `https://fantasysports.yahooapis.com/fantasy/v2/team/${opponent.teamKey}/roster;week=${week}/players;out=stats?format=json`
            : `https://fantasysports.yahooapis.com/fantasy/v2/team/${opponent.teamKey}/roster/players;out=stats?format=json`;

          try {
            const opponentRosterResponse = await fetch(opponentRosterUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (!opponentRosterResponse.ok) {
              console.log(`Failed to fetch opponent roster for team ${opponent.teamKey}: ${opponentRosterResponse.status} ${opponentRosterResponse.statusText}`);
              opponent.rosterError = `Failed to fetch roster: ${opponentRosterResponse.status} ${opponentRosterResponse.statusText}`;
            } else {
              const opponentRosterData = await opponentRosterResponse.json();
              console.log(`Opponent Roster Data for ${opponent.teamKey}:`, JSON.stringify(opponentRosterData.fantasy_content, null, 2));
              const opponentPlayers = opponentRosterData.fantasy_content.team?.[1]?.roster?.[0]?.players || {};
              for (const playerIndex in opponentPlayers) {
                if (playerIndex === "count") continue;
                const player = opponentPlayers[playerIndex]?.player;
                if (!player) continue;
                const playerData = player[0];
                const stats = player[1]?.player_stats?.stats || [];
                const projectedStats = player[1]?.player_projected_stats?.stats || [];

                opponentRoster.push({
                  playerId: playerData?.[0]?.player_id,
                  name: playerData.find(item => item.name)?.name?.full,
                  position: playerData.find(item => item.display_position)?.display_position,
                  points: stats.find(stat => stat.stat_id === "1000")?.value ?? "0.00",
                  projectedPoints: projectedStats.find(stat => stat.stat_id === "1000")?.value ?? "0.00",
                });
              }
            }
          } catch (err) {
            console.log(`Error fetching opponent roster for team ${opponent.teamKey}: ${err.message}`);
            opponent.rosterError = `Error fetching roster: ${err.message}`;
          }
        } else {
          console.log(`No teamKey found for opponent teamId ${opponent.teamId} in matchup ${week}`);
          opponent.rosterError = "Opponent team key not found in league data";
        }

        simplifiedMatchups.push({
          week,
          weekStart,
          weekEnd,
          status,
          yourTeam,
          opponent: { ...opponent, roster: opponentRoster },
        });
      } else {
        console.log(`Skipping matchup ${week}: Missing yourTeam or opponent data`);
      }
    }

    // Step 7: Process your team's roster
    const roster = rosterData.fantasy_content.team?.[1]?.roster?.[0]?.players || {};
    const simplifiedRoster = [];
    for (const playerIndex in roster) {
      if (playerIndex === "count") continue;
      const player = roster[playerIndex]?.player;
      if (!player) {
        console.log(`Invalid player at index ${playerIndex}:`, roster[playerIndex]);
        continue;
      }
      const playerData = player[0];
      const stats = player[1]?.player_stats?.stats || [];
      const projectedStats = player[1]?.player_projected_stats?.stats || [];

      simplifiedRoster.push({
        playerId: playerData?.[0]?.player_id,
        name: playerData.find(item => item.name)?.name?.full,
        position: playerData.find(item => item.display_position)?.display_position,
        points: stats.find(stat => stat.stat_id === "1000")?.value ?? "0.00",
        projectedPoints: projectedStats.find(stat => stat.stat_id === "1000")?.value ?? "0.00",
      });
    }

    // Step 8: Build response
    const response = {
      teamName: "Hit the showers!",
      teamKey,
      matchups: simplifiedMatchups,
      roster: simplifiedRoster,
    };
    if (!hasProjectedData) {
      response.warning = "Projected points and win probabilities are unavailable, likely because the season has not started.";
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}