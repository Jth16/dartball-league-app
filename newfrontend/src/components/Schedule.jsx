import React from 'react';

const Schedule = () => {
  return (
    <div className="sb-schedule">
      <style>{`
        :root{
          --bg: #0f1720;
          --card: #0b1220;
          --header: linear-gradient(90deg, #a5550e, #d47d06);
          --th-bg: rgba(255,255,255,0.06);
          --row-odd: rgba(255,255,255,0.02);
          --row-even: rgba(255,255,255,0.03);
          --muted: #94a3b8;
          --accent: #d4b506ff;
          --text: #e6eef6;
        }

        .sb-schedule{
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text);
          padding: 24px;
          background: linear-gradient(180deg, rgba(6,8,12,0.6), rgba(12,17,23,0.9));
          min-height: 100%;
        }

        .sb-schedule h1{
          margin: 0 0 16px 0;
          color: var(--text);
          font-size: 1.6rem;
          letter-spacing: -0.2px;
        }

        .sb-table-wrap{
          background: var(--card);
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 6px 18px rgba(2,6,23,0.6);
          overflow: auto;
        }

        table{
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          min-width: 820px;
        }

        thead th{
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--header);
          color: #042027;
          font-weight: 700;
          padding: 12px 14px;
          text-align: center;
          border-bottom: 2px solid rgba(0,0,0,0.12);
        }

        th, td{
          padding: 12px 14px;
          text-align: center;
          color: var(--text);
          font-size: 0.95rem;
        }

        tbody tr{
          border-radius: 8px;
        }

        tbody tr:nth-child(odd){
          background: var(--row-odd);
        }

        tbody tr:nth-child(even){
          background: var(--row-even);
        }

        .round-header{
          background: rgba(10,20,30,0.55);
          color: var(--accent);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          font-size: 0.95rem;
        }

        .repetition-start{
          border-top: 3px double rgba(6,182,212,0.18);
        }

        /* Adjusted widths after removing Game Day / Rep. / Round columns */
        td:first-child, th:first-child{
          width: 14%; /* Date */
        }
        td:nth-child(2), th:nth-child(2){
          width: 22%; /* Game 1 */
        }
        td:nth-child(3), th:nth-child(3){
          width: 22%; /* Game 2 */
        }
        td:nth-child(4), th:nth-child(4){
          width: 22%; /* 7:30 Game */
        }
        td:nth-child(5), th:nth-child(5){
          width: 12%; /* Bye Team */
        }

        @media (max-width: 820px){
          .sb-schedule h1{ font-size: 1.25rem; }
          table{ min-width: 720px; }
          th, td{ padding: 10px; font-size: 0.85rem; }
        }
      `}</style>

      <center><h1>7-Team Round Robin Schedule (5 Rounds)</h1></center>

      <div className="sb-table-wrap">
        <table>
          <thead>
            <tr>
             
              <th>Date</th>
           
              <th>6:30 PM Game 1</th>
              <th>6:30 PM Game 2</th>
              <th>7:30 PM Game</th>
              <th>Bye Team</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan="5" className="round-header">Round 1</td></tr>
            <tr>
         
              <td>Oct 29 (Wed)</td>
     
      
              <td>BBD vs Tipsy tossers</td>
              <td>Labelle Firehall vs Wild bunch</td>
              <td>Average Bo's vs Prince of Dartness</td>
              <td>KGB</td>
            </tr>
            <tr>
        
              <td>Nov 3 (Mon)</td>
      
              <td>KGB vs Labelle Firehall</td>
              <td>Average Bo's vs Tipsy tossers</td>
              <td>Prince of Dartness vs Wild bunch</td>
              <td>BBD</td>
            </tr>
            <tr>
     
              <td>Nov 5 (Wed)</td>
      
              <td>BBD vs Average Bo's</td>
              <td>Prince of Dartness vs KGB</td>
              <td>Wild bunch vs Tipsy tossers</td>
              <td>Labelle Firehall</td>
            </tr>
            <tr>
          
              <td>Nov 10 (Mon)</td>
         
              <td>Labelle Firehall vs Prince of Dartness</td>
              <td>Wild bunch vs BBD</td>
              <td>Tipsy tossers vs KGB</td>
              <td>Average Bo's</td>
            </tr>
            <tr>
        
              <td>Nov 12 (Wed)</td>
         
              <td>Average Bo's vs Wild bunch</td>
              <td>Tipsy tossers vs Labelle Firehall</td>
              <td>KGB vs BBD</td>
              <td>Prince of Dartness</td>
            </tr>
            <tr>
          
              <td>Nov 17 (Mon)</td>
        
              <td>Prince of Dartness vs Tipsy tossers</td>
              <td>KGB vs Average Bo's</td>
              <td>BBD vs Labelle Firehall</td>
              <td>Wild bunch</td>
            </tr>
            <tr>
        
              <td>Nov 19 (Wed)</td>
    
              <td>Wild bunch vs KGB</td>
              <td>BBD vs Prince of Dartness</td>
              <td>Labelle Firehall vs Average Bo's</td>
              <td>Tipsy tossers</td>
            </tr>

            <tr><td colSpan="5" className="round-header repetition-start">Round 2</td></tr>
            <tr>
           
              <td>Nov 24 (Mon)</td>
         
              <td>BBD vs Tipsy tossers</td>
              <td>Labelle Firehall vs Wild bunch</td>
              <td>Average Bo's vs Prince of Dartness</td>
              <td>KGB</td>
            </tr>
            <tr>
          
              <td>Nov 26 (Wed)</td>
        
              <td>KGB vs Labelle Firehall</td>
              <td>Average Bo's vs Tipsy tossers</td>
              <td>Prince of Dartness vs Wild bunch</td>
              <td>BBD</td>
            </tr>
            <tr>
           
              <td>Dec 1 (Mon)</td>
       
              <td>BBD vs Average Bo's</td>
              <td>Prince of Dartness vs KGB</td>
              <td>Wild bunch vs Tipsy tossers</td>
              <td>Labelle Firehall</td>
            </tr>
            <tr>
         
              <td>Dec 3 (Wed)</td>
        
              <td>Labelle Firehall vs Prince of Dartness</td>
              <td>Wild bunch vs BBD</td>
              <td>Tipsy tossers vs KGB</td>
              <td>Average Bo's</td>
            </tr>
            <tr>
         
              <td>Dec 8 (Mon)</td>
         
              <td>Average Bo's vs Wild bunch</td>
              <td>Tipsy tossers vs Labelle Firehall</td>
              <td>KGB vs BBD</td>
              <td>Prince of Dartness</td>
            </tr>
            <tr>
         
              <td>Dec 10 (Wed)</td>
          
              <td>Prince of Dartness vs Tipsy tossers</td>
              <td>KGB vs Average Bo's</td>
              <td>BBD vs Labelle Firehall</td>
              <td>Wild bunch</td>
            </tr>
            <tr>
        
              <td>Dec 15 (Mon)</td>
           
              <td>Wild bunch vs KGB</td>
              <td>BBD vs Prince of Dartness</td>
              <td>Labelle Firehall vs Average Bo's</td>
              <td>Tipsy tossers</td>
            </tr>

            <tr><td colSpan="5" className="round-header repetition-start">Round 3</td></tr>
            <tr>
          
              <td>Dec 17 (Wed)</td>
           
              <td>BBD vs Tipsy tossers</td>
              <td>Labelle Firehall vs Wild bunch</td>
              <td>Average Bo's vs Prince of Dartness</td>
              <td>KGB</td>
            </tr>
            <tr>
       
              <td>Dec 22 (Mon)</td>
     
              <td>KGB vs Labelle Firehall</td>
              <td>Average Bo's vs Tipsy tossers</td>
              <td>Prince of Dartness vs Wild bunch</td>
              <td>BBD</td>
            </tr>
            <tr>
       
              <td>Dec 24 (Wed)</td>
    
              <td>BBD vs Average Bo's</td>
              <td>Prince of Dartness vs KGB</td>
              <td>Wild bunch vs Tipsy tossers</td>
              <td>Labelle Firehall</td>
            </tr>
            <tr>
        
              <td>Dec 29 (Mon)</td>
    
              <td>Labelle Firehall vs Prince of Dartness</td>
              <td>Wild bunch vs BBD</td>
              <td>Tipsy tossers vs KGB</td>
              <td>Average Bo's</td>
            </tr>
            <tr>
        
              <td>Dec 31 (Wed)</td>
          
              <td>Average Bo's vs Wild bunch</td>
              <td>Tipsy tossers vs Labelle Firehall</td>
              <td>KGB vs BBD</td>
              <td>Prince of Dartness</td>
            </tr>
            <tr>
     
              <td>Jan 5, 2026 (Mon)</td>
       
              <td>Prince of Dartness vs Tipsy tossers</td>
              <td>KGB vs Average Bo's</td>
              <td>BBD vs Labelle Firehall</td>
              <td>Wild bunch</td>
            </tr>
            <tr>
      
              <td>Jan 7 (Wed)</td>
        
              <td>Wild bunch vs KGB</td>
              <td>BBD vs Prince of Dartness</td>
              <td>Labelle Firehall vs Average Bo's</td>
              <td>Tipsy tossers</td>
            </tr>

            <tr><td colSpan="5" className="round-header repetition-start">Round 4</td></tr>
            <tr>
     
              <td>Jan 12 (Mon)</td>
        
              <td>BBD vs Tipsy tossers</td>
              <td>Labelle Firehall vs Wild bunch</td>
              <td>Average Bo's vs Prince of Dartness</td>
              <td>KGB</td>
            </tr>
            <tr>
    
              <td>Jan 14 (Wed)</td>
     
              <td>KGB vs Labelle Firehall</td>
              <td>Average Bo's vs Tipsy tossers</td>
              <td>Prince of Dartness vs Wild bunch</td>
              <td>BBD</td>
            </tr>
            <tr>

              <td>Jan 19 (Mon)</td>
       
              <td>BBD vs Average Bo's</td>
              <td>Prince of Dartness vs KGB</td>
              <td>Wild bunch vs Tipsy tossers</td>
              <td>Labelle Firehall</td>
            </tr>
            <tr>
      
              <td>Jan 21 (Wed)</td>
           
              <td>Labelle Firehall vs Prince of Dartness</td>
              <td>Wild bunch vs BBD</td>
              <td>Tipsy tossers vs KGB</td>
              <td>Average Bo's</td>
            </tr>
            <tr>
        
              <td>Jan 26 (Mon)</td>
           
              <td>Average Bo's vs Wild bunch</td>
              <td>Tipsy tossers vs Labelle Firehall</td>
              <td>KGB vs BBD</td>
              <td>Prince of Dartness</td>
            </tr>
            <tr>
         
              <td>Jan 28 (Wed)</td>
          
              <td>Prince of Dartness vs Tipsy tossers</td>
              <td>KGB vs Average Bo's</td>
              <td>BBD vs Labelle Firehall</td>
              <td>Wild bunch</td>
            </tr>
            <tr>
          
              <td>Feb 2 (Mon)</td>
          
              <td>Wild bunch vs KGB</td>
              <td>BBD vs Prince of Dartness</td>
              <td>Labelle Firehall vs Average Bo's</td>
              <td>Tipsy tossers</td>
            </tr>

            <tr><td colSpan="5" className="round-header repetition-start">Round 5</td></tr>
            <tr>
           
              <td>Feb 4 (Wed)</td>
         
              <td>BBD vs Tipsy tossers</td>
              <td>Labelle Firehall vs Wild bunch</td>
              <td>Average Bo's vs Prince of Dartness</td>
              <td>KGB</td>
            </tr>
            <tr>
         
              <td>Feb 9 (Mon)</td>
          
              <td>KGB vs Labelle Firehall</td>
              <td>Average Bo's vs Tipsy tossers</td>
              <td>Prince of Dartness vs Wild bunch</td>
              <td>BBD</td>
            </tr>
            <tr>
            
              <td>Feb 11 (Wed)</td>
            
              <td>BBD vs Average Bo's</td>
              <td>Prince of Dartness vs KGB</td>
              <td>Wild bunch vs Tipsy tossers</td>
              <td>Labelle Firehall</td>
            </tr>
            <tr>
         
              <td>Feb 16 (Mon)</td>
    
              <td>Labelle Firehall vs Prince of Dartness</td>
              <td>Wild bunch vs BBD</td>
              <td>Tipsy tossers vs KGB</td>
              <td>Average Bo's</td>
            </tr>
            <tr>
           
              <td>Feb 18 (Wed)</td>
            
              <td>Average Bo's vs Wild bunch</td>
              <td>Tipsy tossers vs Labelle Firehall</td>
              <td>KGB vs BBD</td>
              <td>Prince of Dartness</td>
            </tr>
            <tr>
            
              <td>Feb 23 (Mon)</td>
          
              <td>Prince of Dartness vs Tipsy tossers</td>
              <td>KGB vs Average Bo's</td>
              <td>BBD vs Labelle Firehall</td>
              <td>Wild bunch</td>
            </tr>
            <tr>
        
              <td>Feb 25 (Wed)</td>
      
              <td>Wild bunch vs KGB</td>
              <td>BBD vs Prince of Dartness</td>
              <td>Labelle Firehall vs Average Bo's</td>
              <td>Tipsy tossers</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedule;
