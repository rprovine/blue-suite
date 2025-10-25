import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://daygdgygyokwoasnanco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheWdkZ3lneW9rd29hc25hbmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjE1ODQsImV4cCI6MjA3Njk5NzU4NH0.O2rYSExozW6RAR414ovlf3eyGn2V0VH7eHB_yFfYSRY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Use existing user credentials
const email = 'rprovine@gmail.com';
const password = 'Chi3ft@n';

async function createTestUser() {
  console.log('Populating existing user account with George Tester data');
  console.log('Email:', email);
  console.log('---');

  // Sign in with existing credentials
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Error signing in:', signInError);
    return;
  }

  const userId = authData.user.id;
  console.log('✓ Signed in as user:', userId);

  // Clear existing data first
  console.log('Clearing existing test data...');
  await supabase.from('wam_responses').delete().eq('user_id', userId);
  await supabase.from('weekly_plans').delete().eq('user_id', userId);
  await supabase.from('tactic_completions').delete().eq('user_id', userId);

  // Get existing tactics and goals to delete
  const { data: existingGoals } = await supabase.from('goals').select('id').eq('user_id', userId);
  if (existingGoals && existingGoals.length > 0) {
    const goalIds = existingGoals.map(g => g.id);
    await supabase.from('tactics').delete().in('goal_id', goalIds);
    await supabase.from('goals').delete().eq('user_id', userId);
  }
  console.log('✓ Cleared existing data');

  // Update or Create Vision (10/3/1 year)
  const { data: existingVision } = await supabase
    .from('visions')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingVision) {
    const { error: visionError } = await supabase
      .from('visions')
      .update({
        ten_year_vision: `I own a thriving painting company with 20 employees across three locations in California. My business generates $3M+ annually, and I work primarily on strategic growth while my managers handle day-to-day operations. I have complete financial freedom, take 8 weeks of vacation per year, and am recognized as the go-to premium painting contractor in the Bay Area. My personal wealth allows me to invest in real estate and secure my family's future for generations.`,
        three_year_vision: `Paint Pro has 8 full-time employees and 2 crews running simultaneously. Annual revenue is $750K with 25% profit margins. I've established partnerships with 5 property management companies providing steady recurring work. My brand is known for quality and reliability, with a 5-star rating across all platforms. I have systems in place for estimating, project management, and customer follow-up. I work 40 hours per week and have hired a crew lead to manage daily operations.`,
        one_year_vision: `By the end of this year, Paint Pro revenue reaches $350K with 15% net profit. I have 3 reliable painters on my team and have completed 50+ residential projects. My customer satisfaction rate is 95%+ with strong referrals. I've implemented a CRM system for lead tracking and have a proven sales process. Marketing efforts include a professional website, Google Ads, and partnerships with 2 local real estate agents. I've reduced my hands-on painting time to 50% so I can focus on sales and business development.`,
      })
      .eq('id', existingVision.id);
    if (visionError) {
      console.error('Error updating vision:', visionError);
    } else {
      console.log('✓ Vision updated');
    }
  } else {
    const { error: visionError } = await supabase.from('visions').insert({
      user_id: userId,
      ten_year_vision: `I own a thriving painting company with 20 employees across three locations in California. My business generates $3M+ annually, and I work primarily on strategic growth while my managers handle day-to-day operations. I have complete financial freedom, take 8 weeks of vacation per year, and am recognized as the go-to premium painting contractor in the Bay Area. My personal wealth allows me to invest in real estate and secure my family's future for generations.`,
      three_year_vision: `Paint Pro has 8 full-time employees and 2 crews running simultaneously. Annual revenue is $750K with 25% profit margins. I've established partnerships with 5 property management companies providing steady recurring work. My brand is known for quality and reliability, with a 5-star rating across all platforms. I have systems in place for estimating, project management, and customer follow-up. I work 40 hours per week and have hired a crew lead to manage daily operations.`,
      one_year_vision: `By the end of this year, Paint Pro revenue reaches $350K with 15% net profit. I have 3 reliable painters on my team and have completed 50+ residential projects. My customer satisfaction rate is 95%+ with strong referrals. I've implemented a CRM system for lead tracking and have a proven sales process. Marketing efforts include a professional website, Google Ads, and partnerships with 2 local real estate agents. I've reduced my hands-on painting time to 50% so I can focus on sales and business development.`,
    });
    if (visionError) {
      console.error('Error creating vision:', visionError);
    } else {
      console.log('✓ Vision created');
    }
  }

  // Create Goals
  const goals = [
    {
      title: 'Generate $87,500 in revenue this quarter',
      description: 'Close 15-20 residential painting jobs averaging $5,000 each to reach quarterly revenue target',
      due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 weeks remaining
      order_index: 0,
    },
    {
      title: 'Hire and train 2 reliable painters',
      description: 'Build team capacity by recruiting, vetting, and training 2 skilled painters who can work independently',
      due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      order_index: 1,
    },
    {
      title: 'Establish 2 property management partnerships',
      description: 'Secure ongoing contracts with 2 property management companies for regular maintenance and turnover work',
      due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      order_index: 2,
    },
  ];

  const goalIds = [];
  for (const goal of goals) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId, is_active: true })
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
    } else {
      goalIds.push(data.id);
      console.log('✓ Goal created:', goal.title);
    }
  }

  // Create Tactics
  const tactics = [
    // Goal 1: Revenue
    { goal_id: goalIds[0], description: 'Submit 5 detailed estimates to qualified leads', frequency_per_week: 5, order_index: 0 },
    { goal_id: goalIds[0], description: 'Follow up with 3 pending estimates via phone call', frequency_per_week: 3, order_index: 1 },
    { goal_id: goalIds[0], description: 'Post before/after photos on Instagram and Facebook', frequency_per_week: 3, order_index: 2 },
    { goal_id: goalIds[0], description: 'Ask completed clients for Google reviews and referrals', frequency_per_week: 2, order_index: 3 },

    // Goal 2: Hiring
    { goal_id: goalIds[1], description: 'Post job ads on Indeed and Craigslist', frequency_per_week: 2, order_index: 0 },
    { goal_id: goalIds[1], description: 'Interview at least 2 painter candidates', frequency_per_week: 2, order_index: 1 },
    { goal_id: goalIds[1], description: 'Network at local paint supply stores for referrals', frequency_per_week: 1, order_index: 2 },

    // Goal 3: Partnerships
    { goal_id: goalIds[2], description: 'Cold call 5 property management companies', frequency_per_week: 5, order_index: 0 },
    { goal_id: goalIds[2], description: 'Schedule and complete 2 in-person meetings with property managers', frequency_per_week: 2, order_index: 1 },
    { goal_id: goalIds[2], description: 'Send follow-up proposals to interested property managers', frequency_per_week: 1, order_index: 2 },
  ];

  const tacticIds = [];
  for (const tactic of tactics) {
    const { data, error } = await supabase
      .from('tactics')
      .insert({ ...tactic, is_active: true })
      .select()
      .single();

    if (error) {
      console.error('Error creating tactic:', error);
    } else {
      tacticIds.push({ id: data.id, frequency: tactic.frequency_per_week });
    }
  }
  console.log('✓ Created', tactics.length, 'tactics');

  // Create completion data for weeks 1-6 (currently in week 6)
  const currentProgramWeek = 6;
  const currentYear = new Date().getFullYear();

  // Create realistic completion patterns showing progression through program
  const completionPatterns = [
    0.85, // Week 1: 85% - strong start
    0.78, // Week 2: 78% - slight dip
    0.92, // Week 3: 92% - great week
    0.75, // Week 4: 75% - challenging week
    0.88, // Week 5: 88% - back on track
    0.65, // Week 6: 65% - current week (in progress)
  ];

  for (let programWeek = 1; programWeek <= currentProgramWeek; programWeek++) {
    const completionRate = completionPatterns[programWeek - 1];

    for (const tactic of tacticIds) {
      // Randomize completion count based on target rate
      const targetCount = Math.floor(tactic.frequency * completionRate);
      const actualCount = Math.max(0, Math.min(tactic.frequency, targetCount + Math.floor(Math.random() * 2 - 0.5)));

      const { error } = await supabase.from('tactic_completions').insert({
        tactic_id: tactic.id,
        user_id: userId,
        week_number: programWeek,
        year: currentYear,
        completion_count: actualCount,
        completed_dates: [],
      });

      if (error) {
        console.error('Error creating completion:', error);
      }
    }
  }
  console.log('✓ Created completion data for 6 weeks');

  // Create Weekly Plans for weeks 1-6
  const weeklyPlans = [
    {
      week: 1,
      plans: [
        'Focus on finishing the Johnson exterior project and the Martinez interior. Allocate 3 days for estimates and meetings.',
        'Post job ads and start screening painter candidates. Goal is to interview at least 3 people.',
        'Research and create target list of 25 property management companies in the area.',
      ],
    },
    {
      week: 2,
      plans: [
        'Close 2-3 new jobs from pending estimates. Follow up aggressively on the $12K commercial estimate.',
        'Complete first round of interviews. Bring in top 2 candidates for working interview days.',
        'Make initial contact with first 10 property management companies. Perfect the pitch.',
      ],
    },
    {
      week: 3,
      plans: [
        'Start the Williams whole-house repaint. Ensure crew has all materials to avoid delays.',
        'Make job offer to best painter candidate. Start onboarding paperwork and safety training.',
        'Schedule meetings with 3 property managers who showed interest. Prepare portfolio and references.',
      ],
    },
    {
      week: 4,
      plans: [
        'Complete Williams project on time. Focus on getting 5-star review and referrals from this job.',
        'Continue interviewing for second painter position. New hire should be training on small projects.',
        'Follow up on meetings from last week. Submit proposals to Oak Property Management and Sunset Realty Group.',
      ],
    },
    {
      week: 5,
      plans: [
        'Get 3 new estimates submitted this week. Chase down the Henderson kitchen cabinet painting job.',
        'Second painter candidate should be identified by end of week. Start working interview process.',
        'Meet with Oak Property Management to discuss first trial project. Prepare competitive bid for 3-unit turnover.',
      ],
    },
    {
      week: 6,
      plans: [
        'Start the Peterson commercial job - 3 offices need painting. Coordinate with their schedule for minimal disruption.',
        "Finalize second painter hire - Carlos's friend Miguel looks promising. Get him onboarded this week.",
        'Close the Oak Property Management deal! Submit final pricing and aim to start first project next week.',
      ],
    },
  ];

  for (let i = 0; i < weeklyPlans.length; i++) {
    const weekPlan = weeklyPlans[i];
    const programWeek = i + 1;

    for (let j = 0; j < goalIds.length; j++) {
      const { error } = await supabase.from('weekly_plans').insert({
        user_id: userId,
        goal_id: goalIds[j],
        week_number: programWeek,
        year: currentYear,
        plan_text: weekPlan.plans[j],
      });

      if (error) {
        console.error('Error creating weekly plan:', error);
      }
    }
  }
  console.log('✓ Created weekly plans for 6 weeks');

  // Create WAM responses for weeks 1-5 (week 6 is current, no WAM yet)
  const wamResponses = [
    {
      what_went_well: 'Completed Johnson project on time and under budget. Client was thrilled and already referred me to a neighbor. Posted consistently on social media and got 3 new leads from Instagram.',
      what_didnt_go_well: 'Estimating took longer than expected - spent too much time on measurements. One lead ghosted me after I sent the estimate. Realized I need better follow-up system.',
      what_will_do_differently: 'Create estimate templates for common job types to save time. Set calendar reminders to follow up with estimates after 3 days. Start using a CRM app.',
      what_support_needed: 'Need advice on pricing strategy - feeling like I might be too high on some bids. Also need recommendation for simple CRM tool.',
    },
    {
      what_went_well: 'Closed 2 new jobs totaling $9,500! The follow-up calls really worked. Had 4 solid painter interviews and narrowed to 2 finalists. Made 15 cold calls to property managers.',
      what_didnt_go_well: "Materials delivery was delayed on Martinez job, causing 1-day delay. Didn't post enough on social media. Only got 1 property manager to agree to meet.",
      what_will_do_differently: 'Order materials 3 days before job start instead of 1 day. Batch my social media posting on Sundays. Refine my property manager pitch - too salesy.',
      what_support_needed: 'Looking for a good painter background check service. Also want to improve my cold calling script for property managers.',
    },
    {
      what_went_well: 'Amazing week! Hit 92% on tactics. Hired Carlos as my first team painter - he has 8 years experience. Had productive meetings with 2 property managers who seem genuinely interested. Williams project going smoothly.',
      what_didnt_go_well: 'Spent too much time on hiring and less on sales. Only submitted 3 estimates instead of 5. One estimate was rushed and had errors.',
      what_will_do_differently: 'Block out dedicated estimate time on calendar - Tues/Thurs mornings. Double-check all estimates before sending. Carlos can help free up my time for more sales.',
      what_support_needed: "None this week - on a roll! Might need help with employment paperwork and worker's comp insurance setup.",
    },
    {
      what_went_well: 'Williams project completed perfectly - got glowing 5-star review on Google and Yelp. Client referred me to their HOA board. Carlos is working out great and taking on more responsibility.',
      what_didnt_go_well: 'Tough week overall. Only 75% on tactics. Got sick for 2 days which threw everything off. Lost a big bid to a competitor who was $2K cheaper. Missed some follow-up calls.',
      what_will_do_differently: "Need better backup plan when I'm sick - Carlos should be able to handle more. Review my pricing - maybe offering payment plans could help. Set up automatic email follow-ups.",
      what_support_needed: 'Want to understand how to compete on value not just price. Thinking about offering warranty or maintenance packages.',
    },
    {
      what_went_well: 'Back on track with 88% completion! Henderson kitchen cabinet job closed - $4,200. Had second working interview with Miguel (Carlos recommended him). Oak Property Management meeting went exceptionally well.',
      what_didnt_go_well: "Still struggling with pricing objections. Lost another bid where I was higher. Social media posts aren't getting much engagement despite posting consistently.",
      what_will_do_differently: "Going to create a value-add sheet showing warranty, insurance, references. Need to improve social media content - more before/after transformations. Will ask Carlos to help with Miguel's training.",
      what_support_needed: 'Would love examples of how other contractors position premium pricing. Also interested in social media content ideas that actually convert to leads.',
    },
  ];

  for (let i = 0; i < wamResponses.length; i++) {
    const wam = wamResponses[i];
    const programWeek = i + 1;

    const { error } = await supabase.from('wam_responses').insert({
      user_id: userId,
      week_number: programWeek,
      year: currentYear,
      what_went_well: wam.what_went_well,
      what_didnt_go_well: wam.what_didnt_go_well,
      what_will_do_differently: wam.what_will_do_differently,
      what_support_needed: wam.what_support_needed,
    });

    if (error) {
      console.error('Error creating WAM response:', error);
    }
  }
  console.log('✓ Created WAM responses for 5 weeks');

  console.log('\n=== TEST USER POPULATED SUCCESSFULLY ===');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Name: George Tester');
  console.log('Business: Paint Pro (Painting Contractor)');
  console.log('Current Week: 6 of 12');
  console.log('Average Score: ~81%');
  console.log('\nLogin at: https://blue-suite-recj8gvkc-rprovines-projects.vercel.app');
}

createTestUser().catch(console.error);
