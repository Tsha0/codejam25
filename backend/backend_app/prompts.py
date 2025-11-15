"""VibeCoding competition prompts.

Each prompt includes:
- title: Short name for the challenge
- description: What contestants should create
- requirements: Specific features that should be included
- grading_criteria: What the AI judge should look for
"""

from __future__ import annotations

from dataclasses import dataclass
from random import choice
from typing import List


@dataclass
class Prompt:
    """A VibeCoding challenge prompt."""
    
    title: str
    description: str
    requirements: List[str]
    grading_criteria: List[str]
    
    def to_dict(self):
        """Convert to dictionary format."""
        return {
            "title": self.title,
            "description": self.description,
            "requirements": self.requirements,
            "grading_criteria": self.grading_criteria,
        }
    
    def get_full_prompt(self) -> str:
        """Get the full prompt text for contestants."""
        return f"{self.title}: {self.description}"
    
    def get_grading_context(self) -> str:
        """Get the context for AI grading."""
        requirements_text = "\n".join(f"- {req}" for req in self.requirements)
        criteria_text = "\n".join(f"- {crit}" for crit in self.grading_criteria)
        
        return f"""Challenge: {self.title}
Description: {self.description}

Requirements:
{requirements_text}

Grading Criteria:
{criteria_text}"""


# Collection of VibeCoding prompts
PROMPTS = [
    Prompt(
        title="Coffee Shop Landing Page",
        description="Create a landing page for a local coffee shop",
        requirements=[
            "Hero section with shop name and tagline",
            "Menu or featured drinks section",
            "Call-to-action button (Order Now or Visit Us)",
            "Warm, inviting color scheme",
        ],
        grading_criteria=[
            "Visual appeal and theme consistency",
            "Layout organization",
            "Color scheme and atmosphere",
            "Overall design quality",
        ],
    ),
    
    Prompt(
        title="Personal Portfolio Site",
        description="Design a simple portfolio website for a creative professional",
        requirements=[
            "Header with name and title",
            "About section with bio",
            "Projects or work showcase grid",
            "Contact section or social links",
        ],
        grading_criteria=[
            "Professional appearance",
            "Layout and spacing",
            "Visual hierarchy",
            "Overall presentation",
        ],
    ),
    
    Prompt(
        title="Fitness App Landing",
        description="Build a landing page for a fitness or workout app",
        requirements=[
            "Hero section with app description",
            "Features section highlighting benefits",
            "Download or signup button",
            "Energetic color scheme and styling",
        ],
        grading_criteria=[
            "Energy and motivation conveyed",
            "Layout effectiveness",
            "Color choices",
            "Call-to-action prominence",
        ],
    ),
    
    Prompt(
        title="Restaurant Menu Page",
        description="Create a digital menu page for a restaurant",
        requirements=[
            "Restaurant name and logo area",
            "Menu items with names and prices",
            "Category sections (appetizers, mains, desserts)",
            "Appetizing visual design",
        ],
        grading_criteria=[
            "Readability and organization",
            "Visual appeal",
            "Menu item presentation",
            "Overall design quality",
        ],
    ),
    
    Prompt(
        title="Weather Dashboard",
        description="Design a weather information dashboard",
        requirements=[
            "Current temperature display",
            "Weather condition and location",
            "Forecast for upcoming days",
            "Clean, modern layout",
        ],
        grading_criteria=[
            "Information clarity",
            "Visual design",
            "Layout organization",
            "Aesthetic appeal",
        ],
    ),
    
    Prompt(
        title="Blog Homepage",
        description="Build a homepage for a personal blog",
        requirements=[
            "Blog title and header",
            "Featured blog posts with titles and excerpts",
            "Navigation menu",
            "Sidebar or footer with info",
        ],
        grading_criteria=[
            "Content hierarchy",
            "Readability",
            "Layout balance",
            "Overall design",
        ],
    ),
    
    Prompt(
        title="Product Launch Page",
        description="Create a product launch announcement page",
        requirements=[
            "Product name and headline",
            "Product image or visual",
            "Key features section",
            "Pre-order or notify me button",
        ],
        grading_criteria=[
            "Excitement and impact",
            "Product presentation",
            "Layout effectiveness",
            "Visual appeal",
        ],
    ),
    
    Prompt(
        title="Event RSVP Page",
        description="Design an event invitation and RSVP page",
        requirements=[
            "Event title and date/time",
            "Event details and location",
            "RSVP form or button",
            "Festive or themed styling",
        ],
        grading_criteria=[
            "Information clarity",
            "Theme and atmosphere",
            "Layout organization",
            "Visual appeal",
        ],
    ),
    
    Prompt(
        title="Travel Destination Page",
        description="Build a page showcasing a travel destination",
        requirements=[
            "Destination name and hero image",
            "Description and highlights",
            "Photo gallery or attractions",
            "Book now or learn more button",
        ],
        grading_criteria=[
            "Inspirational appeal",
            "Visual storytelling",
            "Layout and spacing",
            "Overall design",
        ],
    ),
    
    Prompt(
        title="Music Player Interface",
        description="Create a music player control interface",
        requirements=[
            "Album art and song information",
            "Play/pause and control buttons",
            "Progress bar or timeline",
            "Modern, sleek design",
        ],
        grading_criteria=[
            "User interface clarity",
            "Control visibility",
            "Visual design",
            "Overall aesthetics",
        ],
    ),
    
    Prompt(
        title="Login Portal",
        description="Design a modern login page for a web application",
        requirements=[
            "Login form with email and password fields",
            "Submit button",
            "Forgot password link",
            "Professional, clean design",
        ],
        grading_criteria=[
            "Form usability",
            "Visual design",
            "Layout balance",
            "Professional appearance",
        ],
    ),
    
    Prompt(
        title="Coming Soon Page",
        description="Create a coming soon teaser page for a new website",
        requirements=[
            "Company or project name",
            "Countdown or launch date",
            "Email signup for updates",
            "Eye-catching design",
        ],
        grading_criteria=[
            "Anticipation and excitement",
            "Visual impact",
            "Layout effectiveness",
            "Overall design",
        ],
    ),
    
    Prompt(
        title="Newsletter Signup",
        description="Build a newsletter subscription landing page",
        requirements=[
            "Headline explaining benefits",
            "Email input field",
            "Subscribe button",
            "Compelling visual design",
        ],
        grading_criteria=[
            "Persuasiveness",
            "Form clarity",
            "Visual appeal",
            "Call-to-action strength",
        ],
    ),
    
    Prompt(
        title="Pricing Comparison Page",
        description="Design a pricing page with multiple plan options",
        requirements=[
            "At least 2-3 pricing tiers",
            "Features list for each plan",
            "Price display",
            "Purchase or signup buttons",
        ],
        grading_criteria=[
            "Comparison clarity",
            "Layout organization",
            "Visual distinction",
            "Professional design",
        ],
    ),
    
    Prompt(
        title="404 Error Page",
        description="Create a creative 404 error page",
        requirements=[
            "404 or error message",
            "Helpful explanation",
            "Link to homepage",
            "Creative or friendly design",
        ],
        grading_criteria=[
            "Creativity and personality",
            "Helpfulness",
            "Visual design",
            "Overall appeal",
        ],
    ),
]


def get_random_prompt() -> Prompt:
    """Get a random prompt for a new game."""
    return choice(PROMPTS)


def get_prompt_by_title(title: str) -> Prompt | None:
    """Get a specific prompt by title."""
    for prompt in PROMPTS:
        if prompt.title == title:
            return prompt
    return None


def get_all_prompts() -> List[Prompt]:
    """Get all available prompts."""
    return PROMPTS

