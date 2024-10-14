export function getJaysSchedule() {
  fetch("/mlb")
    .then((response) => response.json())
    .then((payload) => {
      const game = payload.dates?.[0]?.games?.[0];
      if (game) {
        const gameStart = moment(game.gameDate);
        const gameState = game.status.abstractGameState;
        const detailedState = game.status.detailedState;
        const isRecentGame = gameStart.isAfter(moment().subtract(1, 'day'));

        console.log(`Start date: ${gameStart.toString()}`);
        console.log(gameState);

        if (isRecentGame) {
          const awayTeam = game.teams.away.team.abbreviation;
          const awayTeamId = game.teams.away.team.id;
          const awayTeamScore = game.teams.away.score;

          const homeTeam = game.teams.home.team.abbreviation;
          const homeTeamId = game.teams.home.team.id;
          const homeTeamScore = game.teams.home.score;

          const awayTeamRecord = game.teams.away.leagueRecord;
          const awayTeamRecordDisplay = `${awayTeamRecord.wins} - ${awayTeamRecord.losses}`;

          const homeTeamRecord = game.teams.home.leagueRecord;
          const homeTeamRecordDisplay = `${homeTeamRecord.wins} - ${homeTeamRecord.losses}`;

          document.querySelector("#away-team-logo").src = teamLogoUrl(awayTeamId);
          document.querySelector("#home-team-logo").src = teamLogoUrl(homeTeamId);

          document.querySelector("#away-team-name").textContent = awayTeam;
          document.querySelector("#away-team-name-detail").textContent = awayTeamRecordDisplay;
          document.querySelector("#home-team-name").textContent = homeTeam;
          document.querySelector("#home-team-name-detail").textContent = homeTeamRecordDisplay;

          document.querySelector("#game-status-text").textContent = detailedState;
          if (gameStart.isAfter(moment())) {
            // upcoming
            document.querySelector("#game-status-text").textContent = "@";
            document.querySelector("#game-status-subtext").textContent = gameStart.format("h:mm");
            document.querySelector("#home-team-score").textContent = "";
            document.querySelector("#away-team-score").textContent = "";
          } else if (gameState === "Live") {
            // in progress
            document.querySelector("#home-team-score").textContent = homeTeamScore;
            document.querySelector("#away-team-score").textContent = awayTeamScore;

            const inning = game.linescore.currentInningOrdinal;
            const state = game.linescore.inningState;
            const outs = game.linescore.outs;
            document.querySelector("#game-status-text").textContent = `${state} ${inning}`;

            const outText = outs < 3 ? `${outs} out` : "";
            document.querySelector("#game-status-subtext").textContent = outText;
          } else {
            // complete
            document.querySelector("#home-team-score").textContent = homeTeamScore;
            document.querySelector("#away-team-score").textContent = awayTeamScore;
            document.querySelector("#game-status-subtext").textContent = "";
          }
        } else {
          console.log("NO GAME!");
        }
      }
    });
}

function teamLogoUrl(teamId) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}


export function getJaysStandings() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const startOfSeasonDate = new Date(currentYear, 3, 1); // April 1st (month is 0-indexed)
  const endOfSeasonDate = new Date(currentYear, 9, 2); // October 2nd (month is 0-indexed)

  const standingsEl = document.querySelector("#mlb-standings");
  standingsEl.innerHTML = ""; // Clear out old data

  if (currentDate < startOfSeasonDate) {
    console.log("Season hasn't started yet. Skipping standings fetch.");
    return;
  }

  if (currentDate > endOfSeasonDate) {
    console.log("Season has ended. Skipping standings fetch.");
    return;
  }

  fetch("/mlb-standings")
    .then((response) => response.json())
    .then((payload) => {
      console.log(payload);

      // Get top 5 wild card teams in AL
      const standingsRaw = payload?.records?.[0].teamRecords?.slice(0, 5) ?? [];

      const standings = standingsRaw.map((data) => {
        return {
          teamName: data.team.teamName,
          teamLogo: teamLogoUrl(data.team.id),
          wildCardRank: parseInt(data.wildCardRank),
          wildCardGamesBack: data.wildCardGamesBack,
          gamesBack: data.gamesBack,
        }
      });

      console.log(standings);

      if (standings.length > 0) {
        const titleEl = document.createElement('div');
        titleEl.classList.add('text-5');
        titleEl.innerText = "AL Wild Card Race";
        standingsEl.appendChild(titleEl);

        const table = document.createElement("section");
        table.classList.add('standings-table');
        standingsEl.appendChild(table);

        standings.forEach((standing) => {

          const rowEl = document.createElement("div");
          rowEl.classList.add('standings-row');

          // Add the logo
          const imgWrapper = document.createElement("div");
          imgWrapper.classList.add('image-wrapper-small');
          imgWrapper.classList.add('standings-col');
          const img = document.createElement('img');
          img.classList.add('team-logo-small');
          img.src = standing.teamLogo;
          imgWrapper.appendChild(img);
          rowEl.appendChild(imgWrapper);

          // Team name
          const nameEl = document.createElement('div');
          nameEl.classList.add('standings-col');
          nameEl.innerText = standing.teamName;
          rowEl.appendChild(nameEl);

          // Wild Card Games Back
          const wcBackEl = document.createElement('div');
          wcBackEl.classList.add('standings-col');
          wcBackEl.classList.add('standings-count');
          wcBackEl.innerText = standing.wildCardGamesBack;
          rowEl.appendChild(wcBackEl);

          // Division Games Back
          const gamesBackEl = document.createElement('div');
          gamesBackEl.classList.add('standings-col');
          gamesBackEl.classList.add('standings-count');
          gamesBackEl.innerText = `(${standing.gamesBack})`;
          rowEl.appendChild(gamesBackEl);

          table.appendChild(rowEl);
        });
      }

    });
}
