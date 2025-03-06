import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const EnhancedCostModeler = () => {
  const [params, setParams] = useState({
    initialTokens: 1200,
    turnsToModel: 20,
    avgHumanTokensPerTurn: 100,
    avgAITokensPerTurn: 150,
    tokenVariability: 50, // +/- random variation in tokens
    baseInputCost: 3.0,
    cacheWriteCost: 3.75,
    cacheReadCost: 0.30,
    outputCost: 15.0,
  });
  
  const [showCumulative, setShowCumulative] = useState(true);
  const [showWithCache, setShowWithCache] = useState(true);
  const [showWithoutCache, setShowWithoutCache] = useState(true);
  const [includeOutputCosts, setIncludeOutputCosts] = useState(true);
  
  const generateData = () => {
    const data = [];
    let cachedTotal = params.initialTokens;
    let cacheRunningCost = cachedTotal * (params.cacheWriteCost/1000000);
    let noCache = cachedTotal * (params.baseInputCost/1000000);
    let outputRunningCost = 0;
    let prevCacheRunning = 0;
    let prevNoCache = 0;
    
    // First turn: generate AI output based on initial prompt
    let currentAITokens = params.avgAITokensPerTurn + 
      (Math.random() * 2 - 1) * params.tokenVariability;
    const firstOutputCost = currentAITokens * (params.outputCost/1000000);
    outputRunningCost = firstOutputCost;
    
    data.push({
      turn: 1,
      totalTokens: cachedTotal,
      aiTokens: Math.round(currentAITokens),
      withCacheCumulative: Number(cacheRunningCost.toFixed(6)),
      withoutCacheCumulative: Number(noCache.toFixed(6)),
      outputCost: Number(firstOutputCost.toFixed(6)),
      outputCumulative: Number(outputRunningCost.toFixed(6)),
      totalWithCacheCumulative: Number((cacheRunningCost + (includeOutputCosts ? firstOutputCost : 0)).toFixed(6)),
      totalWithoutCacheCumulative: Number((noCache + (includeOutputCosts ? firstOutputCost : 0)).toFixed(6)),
      withCachePerTurn: Number(cacheRunningCost.toFixed(6)),
      withoutCachePerTurn: Number(noCache.toFixed(6)),
      totalWithCachePerTurn: Number((cacheRunningCost + (includeOutputCosts ? firstOutputCost : 0)).toFixed(6)),
      totalWithoutCachePerTurn: Number((noCache + (includeOutputCosts ? firstOutputCost : 0)).toFixed(6)),
    });
    
    prevCacheRunning = cacheRunningCost;
    prevNoCache = noCache;

    for (let i = 1; i < params.turnsToModel; i++) {
      // Generate human input for this turn
      const humanTokens = params.avgHumanTokensPerTurn + 
        (Math.random() * 2 - 1) * params.tokenVariability;
      
      // Add previous AI response and human input to total
      cachedTotal += currentAITokens + humanTokens;
      
      // Generate AI response for this turn
      currentAITokens = params.avgAITokensPerTurn + 
        (Math.random() * 2 - 1) * params.tokenVariability;
      
      // Calculate output costs for this AI response
      const turnOutputCost = currentAITokens * (params.outputCost/1000000);
      outputRunningCost += turnOutputCost;
      
      // Calculate cached costs - read prior content, write new content
      const newTokens = humanTokens + currentAITokens;
      cacheRunningCost += 
        (cachedTotal - newTokens) * (params.cacheReadCost/1000000) + 
        newTokens * (params.cacheWriteCost/1000000);
      
      // Calculate non-cached costs - process everything each time
      noCache += cachedTotal * (params.baseInputCost/1000000);
      
      data.push({
        turn: i + 1,
        totalTokens: Math.round(cachedTotal),
        aiTokens: Math.round(currentAITokens),
        humanTokens: Math.round(humanTokens),
        withCacheCumulative: Number(cacheRunningCost.toFixed(6)),
        withoutCacheCumulative: Number(noCache.toFixed(6)),
        outputCost: Number(turnOutputCost.toFixed(6)),
        outputCumulative: Number(outputRunningCost.toFixed(6)),
        totalWithCacheCumulative: Number((cacheRunningCost + (includeOutputCosts ? outputRunningCost : 0)).toFixed(6)),
        totalWithoutCacheCumulative: Number((noCache + (includeOutputCosts ? outputRunningCost : 0)).toFixed(6)),
        withCachePerTurn: Number((cacheRunningCost - prevCacheRunning).toFixed(6)),
        withoutCachePerTurn: Number((noCache - prevNoCache).toFixed(6)),
        totalWithCachePerTurn: Number((cacheRunningCost - prevCacheRunning + (includeOutputCosts ? turnOutputCost : 0)).toFixed(6)),
        totalWithoutCachePerTurn: Number((noCache - prevNoCache + (includeOutputCosts ? turnOutputCost : 0)).toFixed(6)),
      });
      
      prevCacheRunning = cacheRunningCost;
      prevNoCache = noCache;
    }
    
    return data;
  };

  const data = generateData();
  const finalTurn = data[data.length - 1];
  const inputSavings = finalTurn.withoutCacheCumulative - finalTurn.withCacheCumulative;
  const totalSavings = finalTurn.totalWithoutCacheCumulative - finalTurn.totalWithCacheCumulative;
  const savingsPercent = (totalSavings / finalTurn.totalWithoutCacheCumulative * 100).toFixed(1);

  return (
    <div className="w-full p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block">
            Initial Tokens (system prompt)
            <input 
              type="number" 
              value={params.initialTokens}
              onChange={e => setParams({...params, initialTokens: Number(e.target.value)})}
              className="w-full mt-1 px-2 py-1 border rounded"
            />
          </label>
          <label className="block">
            Avg Human Tokens Per Turn
            <input 
              type="number"
              value={params.avgHumanTokensPerTurn}
              onChange={e => setParams({...params, avgHumanTokensPerTurn: Number(e.target.value)})}
              className="w-full mt-1 px-2 py-1 border rounded"
            />
          </label>
          <label className="block">
            Avg AI Tokens Per Turn
            <input 
              type="number"
              value={params.avgAITokensPerTurn}
              onChange={e => setParams({...params, avgAITokensPerTurn: Number(e.target.value)})}
              className="w-full mt-1 px-2 py-1 border rounded"
            />
          </label>
          <label className="block">
            Token Variability (+/-)
            <input 
              type="number"
              value={params.tokenVariability}
              onChange={e => setParams({...params, tokenVariability: Number(e.target.value)})}
              className="w-full mt-1 px-2 py-1 border rounded"
            />
          </label>
        </div>
        <div className="space-y-2">
          <label className="block">
            Number of Turns
            <input 
              type="number"
              value={params.turnsToModel}
              onChange={e => setParams({...params, turnsToModel: Number(e.target.value)})}
              className="w-full mt-1 px-2 py-1 border rounded"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              Base Input Cost ($/M)
              <input 
                type="number" 
                step="0.01"
                value={params.baseInputCost}
                onChange={e => setParams({...params, baseInputCost: Number(e.target.value)})}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Cache Write Cost ($/M)
              <input 
                type="number"
                step="0.01"
                value={params.cacheWriteCost}
                onChange={e => setParams({...params, cacheWriteCost: Number(e.target.value)})}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Cache Read Cost ($/M)
              <input 
                type="number"
                step="0.01"
                value={params.cacheReadCost}
                onChange={e => setParams({...params, cacheReadCost: Number(e.target.value)})}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
            <label className="block">
              Output Cost ($/M)
              <input 
                type="number"
                step="0.01"
                value={params.outputCost}
                onChange={e => setParams({...params, outputCost: Number(e.target.value)})}
                className="w-full mt-1 px-2 py-1 border rounded"
              />
            </label>
          </div>
          <label className="block">
            Include Output Costs
            <select
              value={includeOutputCosts ? "yes" : "no"}
              onChange={e => setIncludeOutputCosts(e.target.value === "yes")}
              className="w-full mt-1 px-2 py-1 border rounded"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Cost Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>Without Cache (Input): ${finalTurn.withoutCacheCumulative.toFixed(4)}</div>
          <div>With Cache (Input): ${finalTurn.withCacheCumulative.toFixed(4)}</div>
          {includeOutputCosts && <div>Output Cost: ${finalTurn.outputCumulative.toFixed(4)}</div>}
          <div>Input Savings: ${inputSavings.toFixed(4)}</div>
          <div>Total Without Cache: ${finalTurn.totalWithoutCacheCumulative.toFixed(4)}</div>
          <div>Total With Cache: ${finalTurn.totalWithCacheCumulative.toFixed(4)}</div>
          <div>Total Savings: ${totalSavings.toFixed(4)} ({savingsPercent}%)</div>
          <div>Final Token Count: {Math.round(finalTurn.totalTokens)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">
          {showCumulative ? "Cumulative Cost Growth" : "Cost Per Turn"}
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowCumulative(!showCumulative)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Show {showCumulative ? "Per Turn" : "Cumulative"}
          </button>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto">
        <div className="flex space-x-4 mb-2">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={showWithCache} 
              onChange={() => setShowWithCache(!showWithCache)}
            />
            <span>With Cache</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={showWithoutCache} 
              onChange={() => setShowWithoutCache(!showWithoutCache)}
            />
            <span>Without Cache</span>
          </label>
        </div>

        <LineChart width={800} height={400} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="turn" 
            label={{ value: 'Turn Number', position: 'insideBottomRight', offset: -10 }}
          />
          <YAxis 
            label={{ 
              value: `Cost (USD)${showCumulative ? ' (Cumulative)' : ' (Per Turn)'}`, 
              angle: -90, 
              position: 'insideLeft', 
              offset: -5
            }}
          />
          <Tooltip 
            formatter={(value, name) => [`$${value.toFixed(6)}`, name.replace(/Cumulative|PerTurn/g, '')]}
            labelFormatter={value => {
              const turn = data[value-1];
              return `Turn ${value} (${turn.totalTokens} total tokens)` + 
               (turn.aiTokens ? `, AI: ${turn.aiTokens}` : '') +
               (turn.humanTokens ? `, Human: ${turn.humanTokens}` : '');
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            wrapperStyle={{ paddingTop: "10px" }}
          />
          {showWithoutCache && (
            <Line 
              type="monotone" 
              dataKey={showCumulative ? "totalWithoutCacheCumulative" : "totalWithoutCachePerTurn"} 
              name="Uncached"
              stroke="#ff7300"
              strokeWidth={2}
            />
          )}
          {showWithCache && (
            <Line 
              type="monotone" 
              dataKey={showCumulative ? "totalWithCacheCumulative" : "totalWithCachePerTurn"}
              name="Cached"
              stroke="#387908"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </div>

      <div className="mt-8 overflow-x-auto">
  <h3 className="text-lg font-bold mb-2">Detailed Cost Breakdown</h3>
  <table className="min-w-full border-collapse border border-gray-300">
    <thead className="bg-gray-100">
      <tr>
        <th className="border border-gray-300 px-4 py-2">Turn</th>
        <th className="border border-gray-300 px-4 py-2">Total Tokens</th>
        {showCumulative ? (
          // Cumulative view columns
          <>
            {showWithCache && <th className="border border-gray-300 px-4 py-2">With Cache (Cumulative)</th>}
            {showWithoutCache && <th className="border border-gray-300 px-4 py-2">Without Cache (Cumulative)</th>}
            {includeOutputCosts && <th className="border border-gray-300 px-4 py-2">Output (Cumulative)</th>}
          </>
        ) : (
          // Per-turn view columns
          <>
            {showWithCache && <th className="border border-gray-300 px-4 py-2">With Cache (Per Turn)</th>}
            {showWithoutCache && <th className="border border-gray-300 px-4 py-2">Without Cache (Per Turn)</th>}
            {includeOutputCosts && <th className="border border-gray-300 px-4 py-2">Output (Per Turn)</th>}
          </>
        )}
      </tr>
    </thead>
    <tbody>
      {data.map((turn, index) => (
        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          <td className="border border-gray-300 px-4 py-2 text-center">{turn.turn}</td>
          <td className="border border-gray-300 px-4 py-2 text-right">{turn.totalTokens}</td>
          {showCumulative ? (
            // Cumulative values
            <>
              {showWithCache && 
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${turn.totalWithCacheCumulative.toFixed(6)}
                </td>
              }
              {showWithoutCache && 
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${turn.totalWithoutCacheCumulative.toFixed(6)}
                </td>
              }
              {includeOutputCosts && 
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${turn.outputCumulative.toFixed(6)}
                </td>
              }
            </>
          ) : (
            // Per-turn values
            <>
              {showWithCache && 
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${turn.totalWithCachePerTurn.toFixed(6)}
                </td>
              }
              {showWithoutCache && 
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${turn.totalWithoutCachePerTurn.toFixed(6)}
                </td>
              }
              {includeOutputCosts && 
                <td className="border border-gray-300 px-4 py-2 text-right">
                  ${turn.outputCost.toFixed(6)}
                </td>
              }
            </>
          )}
        </tr>
      ))}
    </tbody>
  </table>
      </div>
      
    </div>
  );
};

export default EnhancedCostModeler;
