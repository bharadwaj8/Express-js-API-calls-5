const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDetailsToResponse = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const convertMatchDetailsToResponse = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

const convertPlayerMatchScoreToResponse = (obj) => {
  return {
    playerMatchId: obj.player_match_id,
    playerId: obj.player_id,
    matchId: obj.match_id,
    score: obj.score,
    fours: obj.fours,
    sixes: obj.sixes,
  };
};
//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details ORDER BY player_id;`;
  const dbResponse = await db.all(getPlayerQuery);
  response.send(dbResponse.map((each) => convertPlayerDetailsToResponse(each)));
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details 
    WHERE player_id=${playerId};`;

  const dbResponse = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsToResponse(dbResponse));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const query = `
    UPDATE player_details 
    SET player_name='${playerName}'
    WHERE player_id=${playerId};`;

  await db.run(query);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id=${matchId};`;
  const dbResponse = await db.get(getMatchQuery);
  response.send(convertMatchDetailsToResponse(dbResponse));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `
    SELECT md.* FROM player_details pd join 
    player_match_score pms on pd.player_id=pms.player_id
    join match_details md on pms.match_id=md.match_id
    WHERE pd.player_id=${playerId};`;
  const dbResponse = await db.all(query);
  response.send(dbResponse.map((each) => convertMatchDetailsToResponse(each)));
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `
    SELECT DISTINCT pd.* FROM player_details pd join 
    player_match_score pms on pd.player_id=pms.player_id
    join match_details md on pms.match_id=md.match_id
    WHERE pd.player_id=${matchId};`;
  const dbResponse = await db.all(query);
  response.send(dbResponse.map((each) => convertPlayerDetailsToResponse(each)));
});

//APi 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `
    SELECT pd.player_id as playerId,
    pd.player_name as playerName,SUM(pms.score) as totalScore,
    SUM(pms.fours) as totalFours,
    SUM(pms.sixes) as totalSixes FROM player_details pd
    join player_match_score pms on
    pd.player_id=pms.player_id
    WHERE pms.player_id=${playerId}
    GROUP BY pd.player_id;`;

  const dbResponse = await db.all(query);
  response.send(dbResponse);
});

module.exports = express;
