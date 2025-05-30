# KissMint Dash Leaderboard Implementation Plan

## Executive Summary

Implementation plan for Daily and Weekly leaderboards with $GLICO token rewards, featuring dynamic prize pools funded by Game Pass purchases. The system incentivizes regular play through fixed daily prizes enhanced by revenue sharing, and growing weekly jackpots.

## 1. Prize Distribution Structure

### Daily Rewards (50 $GLICO Base + Dynamic Bonus)
- **1st Place**: 40% of total pool
- **2nd Place**: 24% of total pool
- **3rd Place**: 16% of total pool
- **4th Place**: 12% of total pool
- **5th Place**: 8% of total pool

### Weekly Rewards (500 $GLICO Base + Dynamic Bonus)
- **1st Place**: 40% of total pool
- **2nd Place**: 24% of total pool
- **3rd Place**: 16% of total pool
- **4th Place**: 12% of total pool
- **5th Place**: 8% of total pool

## 2. Tokenomics & Revenue Model

### Assumptions
- **50 Daily Active Users (DAU)**
- **Average 2 Game Pass purchases per user at 10 $GLICO each**
- **Total daily revenue: 1,000 $GLICO**

### Revenue Allocation
- **Project Treasury**: 70% (700 $GLICO)
- **Prize Pool Contribution**: 30% (300 $GLICO)
  - **Daily Pool Addition**: 30% of contribution (90 $GLICO)
  - **Weekly Pool Addition**: 70% of contribution (210 $GLICO)

### Expected Prize Pools
- **Daily**: 50 + 90 = 140 $GLICO average
- **Weekly**: 500 + (210 × 7) = 1,970 $GLICO average

## 3. Technical Architecture

### Core Components

#### 3.1 Upstash Redis Structure
```javascript
// Leaderboard keys
const KEYS = {
  // Current leaderboards
  daily: 'leaderboard:daily:scores',
  weekly: 'leaderboard:weekly:scores',
  
  // Prize pools
  dailyPool: 'prizepool:daily:current',
  weeklyPool: 'prizepool:weekly:current',
  
  // Archives
  dailyArchive: 'leaderboard:daily:archive:{date}',
  weeklyArchive: 'leaderboard:weekly:archive:{week}',
  
  // Claims and history
  prizeClaims: 'prizes:claims:{address}',
  distributionLog: 'prizes:distributions:{id}'
};
```

#### 3.2 Leaderboard Service
```javascript
class LeaderboardService {
  constructor(redis, tokenService) {
    this.redis = redis;
    this.tokenService = tokenService;
  }

  async submitScore(address, score, gameId) {
    // Validate score
    const isValid = await this.validateScore(address, score, gameId);
    if (!isValid) throw new Error('Invalid score');
    
    // Add to both leaderboards
    await this.redis.zadd(KEYS.daily, score, address);
    await this.redis.zadd(KEYS.weekly, score, address);
    
    // Log submission
    await this.logSubmission(address, score, gameId);
  }

  async getLeaderboard(type, limit = 100) {
    const key = type === 'daily' ? KEYS.daily : KEYS.weekly;
    return await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
  }

  async getCurrentPrizePool(type) {
    const baseAmount = type === 'daily' ? 50 : 500;
    const bonusKey = type === 'daily' ? KEYS.dailyPool : KEYS.weeklyPool;
    const bonus = parseFloat(await this.redis.get(bonusKey) || 0);
    
    return {
      base: baseAmount,
      bonus: bonus,
      total: baseAmount + bonus
    };
  }
}
```

#### 3.3 Prize Pool Manager
```javascript
class PrizePoolManager {
  constructor(redis, config) {
    this.redis = redis;
    this.config = config;
  }

  async addGamePassRevenue(amount, purchaseData) {
    // Calculate allocations
    const prizePoolShare = amount * 0.3; // 30% to prizes
    const dailyShare = prizePoolShare * 0.3; // 30% of that to daily
    const weeklyShare = prizePoolShare * 0.7; // 70% to weekly
    
    // Update pools atomically
    const multi = this.redis.multi();
    multi.incrbyfloat(KEYS.dailyPool, dailyShare);
    multi.incrbyfloat(KEYS.weeklyPool, weeklyShare);
    await multi.exec();
    
    // Log transaction
    await this.logPoolAddition({
      amount,
      dailyShare,
      weeklyShare,
      timestamp: Date.now(),
      purchaseData
    });
    
    // Emit event for real-time updates
    this.emitPoolUpdate();
  }

  async calculateDistribution(totalPool, places = 5) {
    const percentages = [0.4, 0.24, 0.16, 0.12, 0.08];
    return percentages.map(pct => Math.floor(totalPool * pct));
  }
}
```

#### 3.4 Prize Distribution Service
```javascript
class PrizeDistributionService {
  constructor(redis, tokenService, walletService) {
    this.redis = redis;
    this.tokenService = tokenService;
    this.walletService = walletService;
  }

  async settleDailyPrizes() {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    
    try {
      // Get top 5 players
      const winners = await this.redis.zrevrange(KEYS.daily, 0, 4, 'WITHSCORES');
      if (winners.length < 10) { // Need at least 5 players
        await this.logSkippedDistribution('daily', 'Insufficient players');
        return;
      }
      
      // Get current pool
      const pool = await this.prizePoolManager.getCurrentPrizePool('daily');
      const distribution = await this.prizePoolManager.calculateDistribution(pool.total);
      
      // Prepare batch transaction
      const transactions = [];
      for (let i = 0; i < 5; i++) {
        const address = winners[i * 2];
        const score = winners[i * 2 + 1];
        const amount = distribution[i];
        
        transactions.push({
          to: address,
          amount: amount,
          type: 'daily',
          place: i + 1,
          score: score
        });
      }
      
      // Execute multi-send transaction
      const txHash = await this.walletService.multiSendGLICO(transactions);
      
      // Archive leaderboard
      await this.archiveLeaderboard('daily', dateKey, winners);
      
      // Reset daily leaderboard and pool
      await this.redis.del(KEYS.daily);
      await this.redis.set(KEYS.dailyPool, 0);
      
      // Log distribution
      await this.logDistribution({
        type: 'daily',
        date: dateKey,
        winners: transactions,
        txHash: txHash,
        totalDistributed: pool.total
      });
      
      // Notify winners
      await this.notifyWinners(transactions);
      
    } catch (error) {
      await this.handleDistributionError('daily', error);
    }
  }

  async settleWeeklyPrizes() {
    // Similar to daily but with weekly logic
    // Runs every Saturday at 23:59 Tokyo time
  }
}
```

### 4. Implementation Timeline

#### Phase 1: Infrastructure Setup (Week 1)
- [ ] Configure Upstash Redis instances for leaderboards
- [ ] Implement basic leaderboard CRUD operations
- [ ] Set up prize pool tracking system
- [ ] Create data models and schemas
- [ ] Implement score validation logic

#### Phase 2: Prize Distribution System (Week 2)
- [ ] Integrate hot wallet for $GLICO distributions
- [ ] Implement multi-send smart contract calls
- [ ] Create distribution scheduling system
- [ ] Set up Tokyo timezone (JST) cron jobs:
  - Daily: 23:59 JST
  - Weekly: Saturday 23:59 JST
- [ ] Build transaction logging and monitoring

#### Phase 3: Frontend Integration (Week 3)
- [ ] Create leaderboard UI components
- [ ] Add real-time prize pool display
- [ ] Implement winner announcement system
- [ ] Build prize history view
- [ ] Add countdown timers for distributions
- [ ] Create share functionality for winners

#### Phase 4: Testing & Launch (Week 4)
- [ ] Comprehensive testing of automated distributions
- [ ] Gas optimization for batch transfers
- [ ] Implement failsafe mechanisms
- [ ] Set up monitoring and alerts
- [ ] Beta test with limited user group
- [ ] Production deployment

### 5. Security & Reliability

#### 5.1 Security Measures
- **Score Validation**: Existing anti-cheat measures with pattern analysis
- **Multi-sig Wallet**: Hot wallet with 2/3 multisig for distributions
- **Rate Limiting**: Maximum entries per wallet per day
- **Audit Trail**: Complete logging of all transactions

#### 5.2 Failsafe Mechanisms
- **Backup Distribution**: Manual override for failed automated distributions
- **Pool Limits**: Maximum prize pool caps to prevent exploitation
- **Emergency Pause**: Admin ability to halt distributions
- **Rollback Capability**: Archive system allows state recovery

#### 5.3 Monitoring
- **Real-time Alerts**: Discord/Telegram notifications for:
  - Failed distributions
  - Unusual activity patterns
  - Low hot wallet balance
- **Dashboard**: Admin panel showing:
  - Current pool sizes
  - Pending distributions
  - Historical data
  - Player statistics

### 6. Smart Contract Integration

#### 6.1 Multi-Send Contract
```solidity
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract GLICOPrizeDistributor {
    address public owner;
    address public gameWallet;
    IERC20 public glico;
    
    event PrizesDistributed(
        uint8 indexed prizeType, // 0 = daily, 1 = weekly
        address[] winners,
        uint256[] amounts,
        uint256 timestamp
    );
    
    function distributePrizes(
        address[] memory winners,
        uint256[] memory amounts,
        uint8 prizeType
    ) external onlyGameWallet {
        require(winners.length == amounts.length, "Mismatched arrays");
        require(winners.length <= 5, "Too many winners");
        
        uint256 totalAmount = 0;
        for (uint i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(glico.balanceOf(address(this)) >= totalAmount, "Insufficient balance");
        
        for (uint i = 0; i < winners.length; i++) {
            require(glico.transfer(winners[i], amounts[i]), "Transfer failed");
        }
        
        emit PrizesDistributed(prizeType, winners, amounts, block.timestamp);
    }
}
```

### 7. Frontend Features

#### 7.1 Leaderboard Display
- **Live Rankings**: Real-time position updates
- **Score History**: Player's historical performance
- **Prize Eligibility**: Clear indication of prize positions
- **Time Remaining**: Countdown to next distribution

#### 7.2 Prize Pool Widget
```jsx
const PrizePoolWidget = () => {
  const [pools, setPools] = useState({ daily: 0, weekly: 0 });
  
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToPoolUpdates((update) => {
      setPools(update);
      // Show animation for pool increase
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div className="prize-pools">
      <div className="daily-pool">
        <h3>Daily Prize Pool</h3>
        <div className="amount">{pools.daily} $GLICO</div>
        <div className="next-draw">Resets in {timeUntilDaily}</div>
      </div>
      <div className="weekly-pool">
        <h3>Weekly Jackpot</h3>
        <div className="amount">{pools.weekly} $GLICO</div>
        <div className="next-draw">Resets in {timeUntilWeekly}</div>
      </div>
    </div>
  );
};
```

#### 7.3 Winner Announcement
- **Push Notifications**: Immediate winner notification
- **Social Sharing**: Pre-formatted winner tweets/casts
- **Celebration Animation**: Confetti for winners
- **Prize Claim Status**: Transaction confirmation

### 8. Operational Procedures

#### 8.1 Daily Operations
1. **Monitor** prize pool accumulation
2. **Verify** hot wallet balance before distribution
3. **Check** leaderboard integrity
4. **Review** distribution logs

#### 8.2 Weekly Maintenance
1. **Audit** prize distributions
2. **Analyze** player engagement metrics
3. **Adjust** Game Pass pricing if needed
4. **Report** on pool sustainability

#### 8.3 Emergency Procedures
1. **Distribution Failure**: Manual execution via admin panel
2. **Exploit Detection**: Pause distributions, investigate, rollback if needed
3. **Low Balance**: Alert team, top up hot wallet
4. **Smart Contract Issue**: Use backup EOA distribution

### 9. Analytics & Reporting

#### 9.1 Key Metrics
- **Daily Active Users (DAU)**
- **Average Revenue Per User (ARPU)**
- **Prize Pool Growth Rate**
- **Player Retention After Wins**
- **Game Pass Conversion Rate**

#### 9.2 Reports
- **Daily**: Player activity, revenue, distributions
- **Weekly**: Comprehensive metrics, pool sustainability
- **Monthly**: Strategic analysis, optimization recommendations

### 10. Future Enhancements

#### Phase 2 Features (Post-Launch)
1. **Season Pass**: Monthly subscription with bonus pool contributions
2. **Tournament Mode**: Special events with sponsored prize pools
3. **Referral Rewards**: Bonus pool contributions for bringing new players
4. **Achievement System**: Badges and NFTs for leaderboard achievements
5. **Cross-Game Integration**: Shared prize pools with other PatrionDigital games

#### Long-term Considerations
1. **DAO Governance**: Community voting on prize distributions
2. **Dynamic Difficulty**: Adjust game difficulty based on prize pool size
3. **Sponsored Pools**: Partner contributions to prize pools
4. **Regional Leaderboards**: Time-zone specific competitions

## Conclusion

This implementation plan provides a sustainable, engaging, and technically robust leaderboard system for KissMint Dash. The hybrid prize pool model incentivizes both daily engagement and weekly competition, while the 70/30 revenue split ensures long-term sustainability. The automated distribution system minimizes operational overhead while maintaining security and transparency.