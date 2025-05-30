import { useContext } from "react";
import ProjectContext from "../contexts/ProjectContext";

const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

export default useProject;
