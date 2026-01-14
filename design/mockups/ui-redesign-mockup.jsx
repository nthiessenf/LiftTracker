import React, { useState } from 'react';

const LiftTrackMockup = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDay, setSelectedDay] = useState(2); // Wednesday

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const workoutDays = [false, false, true, false, false, false, false]; // Wednesday completed

  const routines = [
    { name: 'Push Day', lastUsed: 'Mon, Jan 12', duration: '20m', exercises: 5 },
    { name: 'Full Body B', lastUsed: 'Never', duration: '25m', exercises: 6 },
    { name: 'Full Body A', lastUsed: 'Never', duration: '25m', exercises: 6 },
  ];

  const exercises = [
    { name: 'Barbell Squat', category: 'Legs', pr: '185 lbs' },
    { name: 'Bench Press', category: 'Chest', pr: '135 lbs' },
    { name: 'Bent-Over Row', category: 'Back', pr: '115 lbs' },
    { name: 'Hanging Leg Raise', category: 'Core', pr: '—' },
    { name: 'Bicep Curl', category: 'Arms', pr: '35 lbs' },
  ];

  // Shared styles
  const cardStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
    transition: 'all 0.2s ease',
  };

  const Dashboard = () => (
    <div style={{ padding: '24px', paddingTop: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ 
          color: '#10b981', 
          fontSize: '14px', 
          fontWeight: '500',
          marginBottom: '4px',
          letterSpacing: '0.5px'
        }}>
          GOOD AFTERNOON
        </p>
        <h1 style={{ 
          fontSize: '38px', 
          fontWeight: '700', 
          color: '#fff',
          letterSpacing: '-1px',
          margin: 0
        }}>
          LiftTrack
        </h1>
      </div>

      {/* Goal Ring Card */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
            <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(1/3) * 264} 264`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>1</span>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>/3</span>
            </div>
          </div>
          
          {/* Stats */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Weekly Goal</p>
              <p style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>3 Workouts</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Current Streak</p>
              <p style={{ color: '#10b981', fontSize: '20px', fontWeight: '600' }}>🔥 1 Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Card */}
      <div style={cardStyle}>
        <h3 style={{ 
          color: '#fff', 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Weekly Progress
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {weekDays.map((day, i) => (
            <div key={day} style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                background: workoutDays[i] 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : i === selectedDay 
                    ? 'transparent'
                    : 'rgba(255,255,255,0.05)',
                border: i === selectedDay && !workoutDays[i]
                  ? '2px solid #10b981'
                  : workoutDays[i]
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.1)',
                boxShadow: workoutDays[i] ? '0 4px 16px rgba(16,185,129,0.3)' : 'none',
              }}>
                {workoutDays[i] && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <span style={{ 
                fontSize: '12px', 
                color: i === selectedDay ? '#10b981' : 'rgba(255,255,255,0.5)',
                fontWeight: i === selectedDay ? '600' : '400'
              }}>
                {day}
              </span>
            </div>
          ))}
        </div>
        <p style={{ 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.5)', 
          fontSize: '14px',
          marginTop: '16px'
        }}>
          1 workout this week
        </p>
      </div>

      {/* Recommended Card */}
      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
        border: '1px solid rgba(16,185,129,0.3)',
        marginTop: '24px'
      }}>
        <p style={{ 
          color: '#10b981', 
          fontSize: '12px', 
          fontWeight: '600',
          letterSpacing: '1px',
          marginBottom: '8px'
        }}>
          RECOMMENDED FOR TODAY
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
              Full Body A
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              6 exercises • ~25 min
            </p>
          </div>
          <button style={buttonStyle}>
            Start →
          </button>
        </div>
      </div>
    </div>
  );

  const Workouts = () => (
    <div style={{ padding: '24px', paddingTop: '60px' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: '#fff',
        letterSpacing: '-0.5px',
        marginBottom: '24px'
      }}>
        Workouts
      </h1>

      {/* Start Empty Workout */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        border: '1px solid rgba(16,185,129,0.3)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontSize: '17px', fontWeight: '600' }}>Start Empty Workout</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Build as you go</p>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>

      {/* Routines Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '32px',
        marginBottom: '16px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '600' }}>Routines</h2>
        <button style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1px solid rgba(16,185,129,0.5)',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Routine Cards */}
      {routines.map((routine, i) => (
        <div key={i} style={{
          ...cardStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '6px' }}>
              {routine.name}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              Last: {routine.lastUsed} • ⏱ {routine.duration}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)'
            }}>
              •••
            </button>
            <button style={{
              ...buttonStyle,
              padding: '10px 20px',
              fontSize: '14px',
            }}>
              Start
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const Library = () => (
    <div style={{ padding: '24px', paddingTop: '60px' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: '#fff',
        letterSpacing: '-0.5px',
        marginBottom: '24px'
      }}>
        Library
      </h1>

      {/* Search Bar */}
      <div style={{
        ...cardStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Search exercises...</span>
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['All', 'Legs', 'Chest', 'Back', 'Core', 'Arms'].map((filter, i) => (
          <button key={filter} style={{
            padding: '10px 18px',
            borderRadius: '20px',
            border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.15)',
            background: i === 0 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: i === 0 ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
          }}>
            {filter}
          </button>
        ))}
      </div>

      {/* Exercise Cards */}
      {exercises.map((exercise, i) => (
        <div key={i} style={{
          ...cardStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', marginBottom: '4px' }}>
              {exercise.name}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              {exercise.category}
              {exercise.pr !== '—' && (
                <span style={{ color: '#10b981', marginLeft: '12px' }}>PR: {exercise.pr}</span>
              )}
            </p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      ))}
    </div>
  );

  const History = () => (
    <div style={{ padding: '24px', paddingTop: '60px' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: '#fff',
        letterSpacing: '-0.5px',
        marginBottom: '24px'
      }}>
        History
      </h1>

      {/* Calendar Card */}
      <div style={{
        ...cardStyle,
        padding: '24px',
      }}>
        {/* Month Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px' }}>‹</button>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>January 2026</h3>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px' }}>›</button>
        </div>

        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '12px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '500' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {/* Previous month days */}
          {[28, 29, 30, 31].map(day => (
            <div key={`prev-${day}`} style={{ 
              textAlign: 'center', 
              padding: '10px 0',
              color: 'rgba(255,255,255,0.2)',
              fontSize: '14px'
            }}>
              {day}
            </div>
          ))}
          {/* Current month */}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div key={day} style={{ 
              textAlign: 'center', 
              padding: '10px 0',
              position: 'relative',
              cursor: 'pointer',
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: day === 14 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'transparent',
                color: day === 14 ? '#fff' : 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                fontWeight: day === 14 ? '600' : '400',
                boxShadow: day === 14 ? '0 4px 12px rgba(16,185,129,0.4)' : 'none',
              }}>
                {day}
              </span>
              {/* Workout indicator dot */}
              {day === 14 && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#fff',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Workout Entry */}
      <div style={{ marginTop: '24px' }}>
        <div style={{
          ...cardStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', marginBottom: '4px' }}>
              Freestyle Workout
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Wed, Jan 14 • No duration
            </p>
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle gradient orb in background */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ paddingBottom: '100px' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'workouts' && <Workouts />}
        {activeTab === 'library' && <Library />}
        {activeTab === 'history' && <History />}
      </div>

      {/* Tab Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(18,18,18,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 0 28px 0',
        display: 'flex',
        justifyContent: 'space-around',
      }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
          { id: 'workouts', label: 'Workout', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
          { id: 'library', label: 'Library', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z' },
          { id: 'history', label: 'History', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '4px 16px',
            }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={activeTab === tab.id ? '#10b981' : 'none'}
              stroke={activeTab === tab.id ? '#10b981' : 'rgba(255,255,255,0.4)'}
              strokeWidth="1.5"
            >
              <path d={tab.icon} />
            </svg>
            <span style={{
              fontSize: '11px',
              color: activeTab === tab.id ? '#10b981' : 'rgba(255,255,255,0.4)',
              fontWeight: activeTab === tab.id ? '600' : '400',
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LiftTrackMockup;

