// pages/admin/mock/role/[slug].js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useState } from "react";
// import { getApiResponse } from '../../../api/admin/mock/questionsFetchFormModel';
import { IoIosArrowBack } from "react-icons/io";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";

export default function Role() {
  const router = useRouter();
 const slug =
    router.query.slug || (typeof window !== "undefined"
      ? localStorage.getItem("currentJobSlug")
      : null);
  const [jobRole, setJobRole] = useState("");
  // const [level, setLevel] = useState("Beginner");
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState("");
  const [user, setUser] = useState(null);
  const [hasAvailableInterviews, setHasAvailableInterviews] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  
useEffect(() => {
  const emailFromApply = localStorage.getItem("candidateEmail");

  if (!emailFromApply) {
    toast.error("Candidate session expired. Please apply again.");
    router.push("/"); // or apply page
    return;
  }

  setEmail(emailFromApply);
}, []);
useEffect(() => {
  if (!slug) return;

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/job-by-slug/${slug}`);
      const data = await res.json();

      if (data.ok && data.job?.jobRole) {
        setJobRole(data.job.jobRole);

        // optional fallback for later pages
        localStorage.setItem("jobRole", data.job.jobRole);
      } else {
        toast.error("Invalid job link");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load job role");
    }
  };

  fetchJob();
}, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent form from submitting normally
    localStorage.removeItem("apiResponseStatus");
    
  
    
    // Show loading indicator
    // toast.loading("Checking interview availability...");
    
    // // Check if user has available interviews
    // const userHasAvailableInterviews = await checkInterviewAvailability();
    // toast.dismiss(); // Dismiss loading toast
    
    // if (!userHasAvailableInterviews) {
    //   setShowErrorModal(true);
    //   return;
    // }
    
    // If we get here, proceed with the interview
    toast.success("Starting interview preparation...");
    
    // Declare formattedQuestions here once
    let formattedQuestions = [];
    
    router.push("/mockInterview/instruction");
  
    // Replace this with a fetch request to your new API
    try {
      const res = await fetch(`/api/admin/mock/questionsFetchFormModel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobRole,
          email,
          // level,
        }),
      });
  
      // Check if the response is OK (status 200)
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Something went wrong. Please try again.");
      }
  
      // Parse the response
      const responseData = await res.json();
  
      console.log('Fetched Questions:', responseData.questions);  // Debug: Log fetched questions
  
      let fetchedQuestions = responseData.questions;
  
      if (fetchedQuestions) {
        // Check if the fetchedQuestions is a string
        if (typeof fetchedQuestions === 'string') {
          console.log('Raw response:', fetchedQuestions);
          
          // Pattern specifically designed for the example format
          // Handle format like "**1. What is the difference between...**"
          const matches = [];
          
          // Create an array to store all possible regex patterns
          const patterns = [
            // Bold number with asterisks pattern
            { regex: /\*\*\d+\.\s+([^*]+?)\*\*/g, type: 'Bold with ** markers' },
            
            // Regular numbered list pattern with period
            { regex: /^\s*\d+\.\s+([^(\n]+)/gm, type: 'Regular numbered list' },
            
            // Numbered list pattern with potential markdown
            { regex: /\d+\.\s+([^\n(]+)/g, type: 'Simple number followed by text' }
          ];
          
          // Try each pattern until we find matches
          // Convert to string once outside the loop
          const questionText = fetchedQuestions.toString();
          
          for (const pattern of patterns) {
            let match;
            pattern.regex.lastIndex = 0; // Reset regex for each use
            
            while ((match = pattern.regex.exec(questionText)) !== null) {
              if (match[1]) {
                const question = match[1].trim();
                matches.push(question);
                console.log(`Found ${pattern.type} question:`, question);
              }
            }
            
            // If we found any matches, stop trying patterns
            if (matches.length > 0) {
              console.log(`Found ${matches.length} questions using pattern: ${pattern.type}`);
              break;
            }
          }
          
          // Remove extra formatting from the questions
          const cleanedMatches = matches.map(q => {
            // Remove any remaining markdown or unnecessary characters
            return q.replace(/\*\*/g, '').trim();
          });
          
          const matchedQuestions = cleanedMatches.length > 0 ? cleanedMatches : null;
          console.log('Extracted questions:', cleanedMatches);
          
          // For debugging
          console.log('Total questions found:', cleanedMatches.length);
  
          console.log('Matched Questions:', matchedQuestions); // Debug: Log matched questions
  
          if (matchedQuestions) {
            // Start with the "Introduce yourself" question as the first element
            const firstName = user?.fullName?.split(' ')[0];
            formattedQuestions = [{
              questionText: `Can you tell me about yourself, including your educational background and previous work experience?`,
              answer: null,
            }];
  
            // Add the fetched questions to the array
            const additionalQuestions = matchedQuestions.map(questionText => ({
              questionText: questionText.trim(),
              answer: null,
            }));
  
            // Prepend the fetched questions after the "Introduce yourself"
            formattedQuestions.push(...additionalQuestions);
  
            // Set the questions in the state with the "Introduce yourself" as the first question
            setQuestions(formattedQuestions);
          } else {
            console.error("No valid questions found in the fetched data.");
          }
        } else {
          console.error('Fetched questions are not in expected string format:', fetchedQuestions);
        }
      } else {
        console.error("No questions received from API.");
      }
  
      console.log("Questions to be sent:", formattedQuestions);
  
      if (formattedQuestions && formattedQuestions.length > 0) {
        const data = { jobRole,email, questions: formattedQuestions };//level
  
        try {
          const res = await fetch(`/api/admin/mock/jobRoleAndQuestionsSave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
  
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData?.error || "Something went wrong. Please try again.");
          }
  
          const response = await res.json();
          // console.log(response.data._id); // Log the successful response
  
          // Store the response _id in localStorage
          if (response.data._id) {
            // Remove the existing items if they exist
            localStorage.removeItem("_id");
            localStorage.removeItem("_idForReport");
  
            // Add the new items
            localStorage.setItem("_id", response.data._id);
            localStorage.setItem("_idForReport", response.data._id);
          }
  
          // Store response status in localStorage to enable button on Instruction page
          localStorage.setItem("apiResponseStatus", "success");
  
        } catch (error) {
          console.error('Error:', error);
          // Store response failure status in localStorage
          localStorage.setItem("apiResponseStatus", "error");
        }
      } else {
        console.error("No questions received. Please try again.");
      }
    } catch (error) {
      console.error('Error during question fetch:', error);
      localStorage.setItem("apiResponseStatus", "error");
    }
  };
  
 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-950 text-white px-6 py-10">
    <Toaster position="top-center" />

    {/* BACK */}
    {/* <Link href="/" className="absolute top-6 left-6">
      <div className="text-gray-400 hover:text-white text-2xl transition">
        <IoIosArrowBack />
      </div>
    </Link> */}

    {/* MAIN CARD */}
    <div className="max-w-xl mx-auto mt-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">

      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-2">
          Ready for Your Interview
        </h1>
        <p className="text-gray-400 text-sm">
          Please confirm your role before starting
        </p>
      </div>

      {/* PROGRESS FLOW */}
      {/* <div className="flex items-center justify-center gap-3 mb-10 text-sm">
        <span className="text-green-400 font-medium">Assessment ✓</span>
        <span className="text-gray-500">→</span>
        <span className="text-blue-400 font-medium">Interview (Current)</span>
        <span className="text-gray-500">→</span>
        <span className="text-gray-500">Report</span>
      </div> */}

      {/* ROLE CARD */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 mb-8 text-center">
        <p className="text-sm text-gray-400 mb-2">Selected Role</p>
        <p className="text-2xl font-semibold text-white tracking-wide">
          {jobRole || "Loading..."}
        </p>
      </div>

     
      

      {/* START BUTTON */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isCheckingAvailability || !jobRole}
        className={`w-full py-3 rounded-lg text-lg font-medium transition-all shadow-lg
        ${
          isCheckingAvailability
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        }`}
      >
        {isCheckingAvailability ? "Preparing..." : "Start Interview"}
      </button>

      {/* FOOTER NOTE */}
      <p className="text-center text-xs text-gray-500 mt-6">
        Make sure your camera & microphone are ready
      </p>
    </div>

    {/* ERROR MODAL (improved) */}
    {showErrorModal && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
        <div className="bg-slate-900 border border-red-500/30 p-6 rounded-xl max-w-md text-center shadow-2xl">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">
            No Interviews Left
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            You’ve used all available interview attempts.
          </p>

          <div className="flex justify-center gap-3">
            <Link href="/profile">
              <button className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700">
                View Profile
              </button>
            </Link>
            <button
              onClick={() => setShowErrorModal(false)}
              className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
