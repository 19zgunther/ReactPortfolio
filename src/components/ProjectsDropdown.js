import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProjectsDropdown.css';

function ProjectsDropdown({ projects }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="dropdown" ref={dropdownRef}>
            <button 
                className="dropdown-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                Projects
            </button>
            {isOpen && (
                <div className="dropdown-content">
                    {projects.map((project, index) => (
                        <Link
                            key={index}
                            to={`/${project.path}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {project.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProjectsDropdown; 