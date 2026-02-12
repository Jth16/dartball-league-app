import React from 'react';

const sectionStyle = { marginBottom: 16, lineHeight: 1.5 };
const headingStyle = { color: '#e6f7ff', marginBottom: 8 };
const textStyle = { color: '#cbd5e1' };
const container = { padding: 16, borderRadius: 10, background: '#07101a', border: '1px solid rgba(255,255,255,0.04)' };

const Rules = () => (
    <article style={container}>
        <h1 style={{ ...headingStyle, fontSize: 30 }}>Official Dartball League Rules</h1>

        <section style={sectionStyle}>
            <h2 style={headingStyle}>1. Game Structure and Duration</h2>
            <div style={textStyle}>
                <ul>
                    <li><strong>Games Per Night:</strong> Each scheduled team will play three (3) games per night against their opponent.</li>
                    <li><strong>Innings:</strong> All games are scheduled for seven (7) innings.</li>
                    <li><strong>Extra Innings:</strong> If tied after seven innings, play continues with extra innings until a winner is decided (standard baseball innings).</li>
                    <li><strong>Home/Away Determination:</strong> Home team (batting second) is decided by coin flip before the first game of the night.</li>
                    <li><strong>Smoking/Vaping:</strong> No smoking or vaping in the Firehall. Smoking permitted in the bar area only.</li>
                    <li><strong>Payment:</strong> Each team pays $20.00 per night.</li>
                    <li><strong>Play Area:</strong> Players and spectators who are not currently throwing must stay out of the throwing area and cannot play defense from the dugouts. Respect the throwers' space.</li>
                </ul>
            </div>
        </section>

        <section style={sectionStyle}>
            <h2 style={headingStyle}>2. Team and Player Requirements</h2>
            <div style={textStyle}>
                <ul>
                    <li><strong>Minimum Players:</strong> A team must have at least four (4) players present to play without penalty.</li>
                    <li><strong>Playing with Three Players:</strong> Teams may play with three (3) players but the missing 4th spot in the batting order is an automatic out each time that spot comes up.</li>
                    <li><strong>Lineup:</strong> Batting order must be declared before the first game and can only be changed between games.</li>
                    <li><strong>Switching Teams:</strong> A player may switch teams only once and cannot return to their previous team.</li>
                </ul>
            </div>
        </section>

        <section style={sectionStyle}>
            <h2 style={headingStyle}>3. Scoring and Gameplay</h2>
            <div style={textStyle}>
                <ul>
                    <li><strong>Outs:</strong> Three outs per inning ends the team's half-inning.</li>
                    <li><strong>Scoring:</strong> Runs scored per standard baseball rules.</li>
                    <li><strong>Batting out of Order:</strong> Batting out of order is an automatic out. The offended player's turn remains up to bat.</li>
                    <li><strong>Automatic Outs:</strong> Offenses that result in an automatic out include batting out of order and stepping over the throwing line on a throw.</li>
                    <li><strong>Dimes:</strong> A throw off the board is a "Dime" — the player owes $0.10 at the end of the night. Team dimes for the night are rounded up to the nearest dollar and payable to the league within one week.</li>
                    <li><strong>Throwing Line:</strong> Everyone throws from the back line. Exceptions: Women, Seniors (65+), and kids under 12 may throw from the front line.</li>
                </ul>
            </div>
        </section>

        <section style={sectionStyle}>
            <h2 style={headingStyle}>4. League Standings and Forfeits</h2>
            <div style={textStyle}>
                <ul>
                    <li><strong>Standings:</strong> Determined by team win percentage. In the Event of a tie, a best of 3 series will determine the higher seed.</li>
                    <li><strong>Playoffs:</strong> Top 8 teams make the playoffs. 8th and 9th place teams play a best-of-3 to decide the final spot.</li>
                    <li><strong>Forfeits:</strong> Fewer than 3 players at scheduled start time = forfeit of all three games (opponent awarded three 1–0 wins).</li>
                    <li><strong>Makeups/Cancellations:</strong> Teams that cannot make a scheduled game must cancel and schedule a makeup. Cancellations must be declared at least 1 hour before the scheduled game or result in a forfeit.</li>
                    <li><strong>Playoff Eligibility:</strong> A player must play in at least 33% of a team's games to be playoff-eligible for that team.</li>
                    <li><strong>Playoff Home and Away:</strong> Home and away designations for playoff games will be determined by regular season standings.</li>
                    <li><strong>Reschedules:</strong> Rescheduled Games will be played the last week of the season.</li>
                </ul>
            </div>
        </section>
    </article>
);

export default Rules;
