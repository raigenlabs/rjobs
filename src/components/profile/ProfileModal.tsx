import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Badge } from '../ui/Badge.tsx';
import { formatIndianPhone } from '../../models/validation.ts';
import {
  GraduationCap,
  MapPin,
  Phone,
  Briefcase,
  Link as LinkIcon,
  Save,
  CheckCircle,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, currentProfile, updateProfile } = useAuth();

  const [headline, setHeadline] = useState(currentProfile?.headline || '');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [location, setLocation] = useState(currentProfile?.location || '');
  const [degree, setDegree] = useState(currentProfile?.degree || '');
  const [college, setCollege] = useState(currentProfile?.college || '');
  const [gradYear, setGradYear] = useState(currentProfile?.graduationYear?.toString() || '2026');
  const [cgpa, setCgpa] = useState(currentProfile?.cgpaOrPercentage || '');
  const [github, setGithub] = useState(currentProfile?.links?.github || '');
  const [linkedin, setLinkedin] = useState(currentProfile?.links?.linkedin || '');
  const [leetcode, setLeetcode] = useState(currentProfile?.links?.leetcode || '');
  const [targetRolesStr, setTargetRolesStr] = useState(
    currentProfile?.targetRoles?.join(', ') || ''
  );
  const [targetLocationsStr, setTargetLocationsStr] = useState(
    currentProfile?.targetLocations?.join(', ') || ''
  );
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if profile changes
  React.useEffect(() => {
    if (currentProfile) {
      setHeadline(currentProfile.headline);
      setPhone(currentProfile.phone);
      setLocation(currentProfile.location);
      setDegree(currentProfile.degree);
      setCollege(currentProfile.college);
      setGradYear(currentProfile.graduationYear.toString());
      setCgpa(currentProfile.cgpaOrPercentage);
      setGithub(currentProfile.links.github || '');
      setLinkedin(currentProfile.links.linkedin || '');
      setLeetcode(currentProfile.links.leetcode || '');
      setTargetRolesStr(currentProfile.targetRoles.join(', '));
      setTargetLocationsStr(currentProfile.targetLocations.join(', '));
    }
  }, [currentProfile]);

  const handlePhoneBlur = () => {
    setPhone((p) => formatIndianPhone(p));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      headline,
      phone: formatIndianPhone(phone),
      location,
      degree,
      college,
      graduationYear: parseInt(gradYear, 10) || 2026,
      cgpaOrPercentage: cgpa,
      links: {
        github,
        linkedin,
        leetcode,
      },
      targetRoles: targetRolesStr
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
      targetLocations: targetLocationsStr
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Candidate Profile (Single Source of Truth)"
      description="All Resume Studio templates and Apply Assist form-fillers read from this master profile."
      maxWidth="2xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* User Info Header */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-200">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>{currentUser?.name}</span>
                <Badge variant={currentUser?.plan === 'pro' ? 'purple' : 'default'} size="sm">
                  {currentUser?.plan?.toUpperCase()} PLAN
                </Badge>
              </div>
              <div className="text-xs text-slate-400">{currentUser?.email}</div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400">Profile Status</div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>100% Complete</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <Input
          label="Professional Headline / Career Objective"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Pre-final Year B.Tech CSE @ IIT Delhi | Ex-Swiggy Intern | Distributed Systems"
          required
        />

        {/* Contact & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Phone Number (India +91 format)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="h-4 w-4" />}
            required
          />
          <Input
            label="Current Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bengaluru / New Delhi, India"
            leftIcon={<MapPin className="h-4 w-4" />}
            required
          />
        </div>

        {/* Academics */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Academic Qualifications</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Degree / Branch"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="B.Tech Computer Science"
              required
            />
            <Input
              label="Institute / University"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="IIT Delhi / NIT Trichy / BITS Pilani"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Graduation Year"
              type="number"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="2026"
              required
            />
            <Input
              label="CGPA / Percentage"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              placeholder="e.g. 8.84 / 10 CGPA"
              required
            />
          </div>
        </div>

        {/* Target Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Roles (comma-separated)"
            value={targetRolesStr}
            onChange={(e) => setTargetRolesStr(e.target.value)}
            placeholder="SDE Intern, Backend Engineer"
            leftIcon={<Briefcase className="h-4 w-4" />}
            helperText="Used by Job Radar matching engine"
          />
          <Input
            label="Target Locations (comma-separated)"
            value={targetLocationsStr}
            onChange={(e) => setTargetLocationsStr(e.target.value)}
            placeholder="Bengaluru, Hyderabad, Remote"
            leftIcon={<MapPin className="h-4 w-4" />}
            helperText="India metro hubs & remote options"
          />
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="GitHub URL"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/username"
            leftIcon={<LinkIcon className="h-4 w-4" />}
          />
          <Input
            label="LinkedIn URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/username"
            leftIcon={<LinkIcon className="h-4 w-4" />}
          />
          <Input
            label="LeetCode Profile"
            value={leetcode}
            onChange={(e) => setLeetcode(e.target.value)}
            placeholder="https://leetcode.com/username"
            leftIcon={<LinkIcon className="h-4 w-4" />}
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={isSaved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          >
            {isSaved ? 'Saved Successfully!' : 'Save Master Profile'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
