# Skill symlinks

Cursor/AltusNova skills live at **`AltusNova/.agent/skills/`** and point to **PTREE generated** skills in `agent/skills/` (six symlinks). Edit skill bodies in the package only — do not duplicate under `.agent/`.

**Unified tree:** `agent/skills/` also holds `reference/{pstack,mongodb,aws}/` (symlinked upstream skills + `SOURCE.md`). Load reference skills by path from the package; they are not wired at repo root unless added explicitly.

Index: `agent/skills/README.md` · Authoring: `agent/skills/SKILL-AUTHORING.md`

If paths move, refresh symlinks:

```bash
cd AltusNova/.agent/skills
ln -sfn ../../NewDiscoveriesandPlans/ptree-new-migration-docs-and-skills/agent/skills/<name> <name>
```
