import { useEffect, useRef } from "react";
import { BOOKMARKLET_HREF } from "../lib/bookmarklet.js";

export default function BookmarkletDialog({ onClose }) {
  const dialogRef = useRef(null);
  const bookmarkletRef = useRef(null);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    if (bookmarkletRef.current) bookmarkletRef.current.href = BOOKMARKLET_HREF;
  }, []);

  return (
    <dialog ref={dialogRef} className="dialog dialog-small" aria-labelledby="capture-title" onClose={onClose}>
      <div className="dialog-header">
        <h2 id="capture-title">Save jobs as you browse</h2>
        <button className="icon-button" type="button" aria-label="Close quick capture help" onClick={() => dialogRef.current?.close()}>×</button>
      </div>
      <div className="dialog-content capture-instructions">
        <p>Drag this link to your bookmarks bar. When a job posting is open, click it to open a prefilled form here.</p>
        <div className="bookmarklet-install">
          <a
            ref={bookmarkletRef}
            className="bookmarklet-link"
            href="#bookmarklet"
            draggable="true"
            onClick={(event) => event.preventDefault()}
          >Track this job</a>
          <span>Drag to bookmarks bar</span>
        </div>
        <p className="capture-note">The title and link are captured; company and location are best-effort. Review them before saving. On mobile, use <strong>Add role</strong> and paste the posting link.</p>
      </div>
      <div className="dialog-footer">
        <button className="button button-quiet" type="button" onClick={() => dialogRef.current?.close()}>Done</button>
      </div>
    </dialog>
  );
}
