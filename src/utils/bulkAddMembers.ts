
import { supabase } from '@/integrations/supabase/client';

// One-time bulk member addition
export const addAllMembers = async () => {
  const members = [
    { firstName: 'Abhishek', lastName: 'Pandey', email: 'abhishek.pandey@iskconbureau.in', phone: '+91 98765 43210' },
    { firstName: 'Aditya', lastName: 'Sharma', email: 'aditya.sharma@iskconbureau.in', phone: '+91 98765 43211' },
    { firstName: 'Ajay', lastName: 'Kumar', email: 'ajay.kumar@iskconbureau.in', phone: '+91 98765 43212' },
    { firstName: 'Akash', lastName: 'Singh', email: 'akash.singh@iskconbureau.in', phone: '+91 98765 43213' },
    { firstName: 'Amit', lastName: 'Gupta', email: 'amit.gupta@iskconbureau.in', phone: '+91 98765 43214' },
    { firstName: 'Anand', lastName: 'Verma', email: 'anand.verma@iskconbureau.in', phone: '+91 98765 43215' },
    { firstName: 'Anil', lastName: 'Joshi', email: 'anil.joshi@iskconbureau.in', phone: '+91 98765 43216' },
    { firstName: 'Ankit', lastName: 'Agarwal', email: 'ankit.agarwal@iskconbureau.in', phone: '+91 98765 43217' },
    { firstName: 'Anuj', lastName: 'Mishra', email: 'anuj.mishra@iskconbureau.in', phone: '+91 98765 43218' },
    { firstName: 'Arjun', lastName: 'Yadav', email: 'arjun.yadav@iskconbureau.in', phone: '+91 98765 43219' },
    { firstName: 'Ashish', lastName: 'Tiwari', email: 'ashish.tiwari@iskconbureau.in', phone: '+91 98765 43220' },
    { firstName: 'Deepak', lastName: 'Singh', email: 'deepak.singh@iskconbureau.in', phone: '+91 98765 43221' },
    { firstName: 'Gaurav', lastName: 'Kumar', email: 'gaurav.kumar@iskconbureau.in', phone: '+91 98765 43222' },
    { firstName: 'Harsh', lastName: 'Gupta', email: 'harsh.gupta@iskconbureau.in', phone: '+91 98765 43223' },
    { firstName: 'Karan', lastName: 'Sharma', email: 'karan.sharma@iskconbureau.in', phone: '+91 98765 43224' },
    { firstName: 'Manish', lastName: 'Verma', email: 'manish.verma@iskconbureau.in', phone: '+91 98765 43225' },
    { firstName: 'Mohit', lastName: 'Jain', email: 'mohit.jain@iskconbureau.in', phone: '+91 98765 43226' },
    { firstName: 'Nitin', lastName: 'Pandey', email: 'nitin.pandey@iskconbureau.in', phone: '+91 98765 43227' },
    { firstName: 'Pankaj', lastName: 'Singh', email: 'pankaj.singh@iskconbureau.in', phone: '+91 98765 43228' },
    { firstName: 'Pradeep', lastName: 'Kumar', email: 'pradeep.kumar@iskconbureau.in', phone: '+91 98765 43229' },
    { firstName: 'Rahul', lastName: 'Agarwal', email: 'rahul.agarwal@iskconbureau.in', phone: '+91 98765 43230' },
    { firstName: 'Rajesh', lastName: 'Mishra', email: 'rajesh.mishra@iskconbureau.in', phone: '+91 98765 43231' },
    { firstName: 'Ravi', lastName: 'Yadav', email: 'ravi.yadav@iskconbureau.in', phone: '+91 98765 43232' },
    { firstName: 'Rohit', lastName: 'Tiwari', email: 'rohit.tiwari@iskconbureau.in', phone: '+91 98765 43233' },
    { firstName: 'Sachin', lastName: 'Sharma', email: 'sachin.sharma@iskconbureau.in', phone: '+91 98765 43234' },
    { firstName: 'Sandeep', lastName: 'Gupta', email: 'sandeep.gupta@iskconbureau.in', phone: '+91 98765 43235' },
    { firstName: 'Sanjay', lastName: 'Verma', email: 'sanjay.verma@iskconbureau.in', phone: '+91 98765 43236' },
    { firstName: 'Suresh', lastName: 'Joshi', email: 'suresh.joshi@iskconbureau.in', phone: '+91 98765 43237' },
    { firstName: 'Vikash', lastName: 'Singh', email: 'vikash.singh@iskconbureau.in', phone: '+91 98765 43238' },
    { firstName: 'Vikas', lastName: 'Kumar', email: 'vikas.kumar@iskconbureau.in', phone: '+91 98765 43239' }
  ];

  console.log('Starting bulk member addition...');
  
  for (const member of members) {
    try {
      console.log(`Adding member: ${member.firstName} ${member.lastName}`);
      
      // Generate a temporary password
      const tempPassword = `temp${Math.random().toString(36).slice(-8)}`;
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email,
        password: tempPassword,
        options: {
          data: {
            first_name: member.firstName,
            last_name: member.lastName,
            phone: member.phone
          }
        }
      });

      if (authError) {
        console.error(`Error creating user ${member.email}:`, authError);
        continue;
      }

      if (!authData.user) {
        console.error(`Failed to create user ${member.email}`);
        continue;
      }

      console.log(`User created: ${member.email}`);

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Ensure the profile is created
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: member.email,
          first_name: member.firstName,
          last_name: member.lastName,
          phone: member.phone
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error(`Profile error for ${member.email}:`, profileError);
      }

      // Add member role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: authData.user.id,
          role: 'member'
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        console.error(`Role error for ${member.email}:`, roleError);
      }

      console.log(`Successfully added: ${member.firstName} ${member.lastName}`);
      
      // Small delay between additions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error adding ${member.firstName} ${member.lastName}:`, error);
    }
  }
  
  console.log('Bulk member addition completed!');
};
