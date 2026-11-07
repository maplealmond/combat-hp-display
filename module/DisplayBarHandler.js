import { translateCustomDisplayModes, getDisplayMode } from '../scripts/combat-hp-display-helpers.js';

export const startCombatUpdate = async (combat) => {
    if(game.user.isGM){
        const gridSettings = await game.settings.get('combat-hp-display', 'grid-display');
        if(gridSettings.enabled && game.canvas.scene){
            await game.canvas.scene.update({ 'grid.alpha': gridSettings.opacity });
        }

        const combatants = Array.from(combat.combatants);
        await combatUpdate(combatants);
    }
}

export const joinCombatUpdate = async (combatant) => {
    if(game.user.isGM && combatant.combat.started){
        await combatUpdate([combatant]);
    }
};

export const combatUpdate = async (combatants) => {
    const inCombat = game.settings.get("combat-hp-display", "combat-display");
    for(var i = 0; i < combatants.length; i++) {
        const combatant = combatants[i];
        await diplayBarUpdate(combatant, inCombat);
    }
};

const diplayBarUpdate = async (combatant, inCombat) => {
    const combatantDisplayMode = getDisplayMode(combatant.token.disposition);
    const displayBarValue = translateCustomDisplayModes(inCombat, combatantDisplayMode);
    if(game.modules.get("barbrawl")?.active){
        const gmOnly = inCombat[combatantDisplayMode].gmOnly;
        const resourceBars = combatant.token.flags.barbrawl?.resourceBars;
        const origResourceBars = cloneResourceBars(resourceBars);
        if(resourceBars){
            Object.keys(resourceBars).forEach(key => {
                resourceBars[key] = {
                    ...resourceBars[key],
                    otherVisibility: !gmOnly ? displayBarValue: undefined,
                    ownerVisibility: !gmOnly ? -1 : undefined,
                    gmVisibility: gmOnly ? displayBarValue : undefined,
                };
            });

            await combatant.token.update({
                "flags.combat-hp-display-bar-brawl-bars": origResourceBars,
                "flags.barbrawl.resourceBars": resourceBars,
            });
        }
    }
    else {
        const displayBarSettings = displayBarValue !== undefined ? { displayBars: displayBarValue } : {};
        await combatant.token.update({
            "flags.combat-hp-display.displayBars": combatant.token.displayBars,
            ...displayBarSettings
        });
    }
};

export const restoreDisplayBars = (combat) => {
    if (!game.user.isGM) return;
    const combatants = Array.from(combat.combatants);
    for (const combatant of combatants) {
        if (game.modules.get("barbrawl")?.active) {
            combatant.token.update({
                "flags.barbrawl.resourceBars": combatant.token.flags["combat-hp-display-bar-brawl-bars"],
            });
        } else {
            const prior = combatant.token.getFlag('combat-hp-display', 'displayBars');
            if (prior !== undefined && prior !== null) {
                combatant.token.update({ displayBars: prior });
            }
        }
    }
};

export const deleteCombatUpdate = async (combat) => {
    const gridSettings = await game.settings.get('combat-hp-display', 'grid-display');
    if(gridSettings.enabled){
        await game.canvas.scene.update({ 'grid.alpha': 0 });
    }
}

const cloneResourceBars = (resourceBars) => {
    const cloned = foundry.utils.deepClone(resourceBars);
    Object.keys(cloned).forEach(key => {
        const bar = cloned[key];
        bar.gmVisibility = bar.gmVisibility === undefined ? -1 : bar.gmVisibility;
    });
    return cloned;
};