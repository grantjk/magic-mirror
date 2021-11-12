export function getJaysSchedule() {
  fetch("/mlb")
    .then((response) => response.json())
    .then((payload) => {
      const game = payload.dates?.[0]?.games?.[0];
      if (game) {
        const gameStart = moment(game.gameDate);
        const gameState = game.status.abstractGameState;
        const detailedState = game.status.detailedState;

        console.log(`Start date: ${gameStart.toString()}`);
        console.log(gameState);

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
        document.querySelector(
          "#away-team-name-detail"
        ).textContent = awayTeamRecordDisplay;
        document.querySelector("#home-team-name").textContent = homeTeam;
        document.querySelector(
          "#home-team-name-detail"
        ).textContent = homeTeamRecordDisplay;

        document.querySelector("#home-team-name").textContent = homeTeam;
        document.querySelector("#home-team-name").textContent = homeTeam;

        document.querySelector("#game-status-text").textContent = detailedState;
        if (gameStart.isAfter(moment())) {
          // upcoming
          document.querySelector("#game-status-text").textContent = "@";
          document.querySelector(
            "#game-status-subtext"
          ).textContent = gameStart.format("h:mm");
          document.querySelector("#home-team-score").textContent = "";
          document.querySelector("#away-team-score").textContent = "";
        } else if (gameState === "Live") {
          // in progress
          document.querySelector(
            "#home-team-score"
          ).textContent = homeTeamScore;
          document.querySelector(
            "#away-team-score"
          ).textContent = awayTeamScore;

          const inning = game.linescore.currentInningOrdinal;
          const state = game.linescore.inningState;
          const outs = game.linescore.outs;
          document.querySelector(
            "#game-status-text"
          ).textContent = `${state} ${inning}`;

          const outText = outs < 3 ? `${outs} out` : "";
          document.querySelector("#game-status-subtext").textContent = outText;
        } else {
          // complete
          document.querySelector(
            "#home-team-score"
          ).textContent = homeTeamScore;
          document.querySelector(
            "#away-team-score"
          ).textContent = awayTeamScore;
          document.querySelector("#game-status-subtext").textContent = "";
        }
      } else {
        console.log("NO GAME!");
      }
    });
}

function teamLogoUrl(teamId) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}


