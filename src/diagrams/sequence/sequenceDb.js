import { logger } from '../../logger';

let prevActor = undefined;
let actors = {};
let messages = [];
const notes = [];
let title = '';
let sequenceNumbersEnabled = false;

export const addActor = function(id, name, description) {
  // Don't allow description nulling
  const old = actors[id];
  if (old && name === old.name && description == null) return;

  // Don't allow null descriptions, either
  if (description == null) description = name;

  actors[id] = { name: name, description: description, prevActor: prevActor };
  if (prevActor && actors[prevActor]) {
    actors[prevActor].nextActor = id;
  }

  prevActor = id;
};

const activationCount = part => {
  let i = 0;
  let count = 0;
  for (i = 0; i < messages.length; i++) {
    // console.warn(i, messages[i]);
    if (messages[i].type === LINETYPE.ACTIVE_START) {
      if (messages[i].from.actor === part) {
        count++;
      }
    }
    if (messages[i].type === LINETYPE.ACTIVE_END) {
      if (messages[i].from.actor === part) {
        count--;
      }
    }
  }
  return count;
};

export const addMessage = function(idFrom, idTo, message, answer) {
  messages.push({ from: idFrom, to: idTo, message: message, answer: answer });
};

export const addSignal = function(idFrom, idTo, message, messageType) {
  logger.debug(
    'Adding message from=' + idFrom + ' to=' + idTo + ' message=' + message + ' type=' + messageType
  );

  if (messageType === LINETYPE.ACTIVE_END) {
    const cnt = activationCount(idFrom.actor);
    logger.debug('Adding message from=', messages, cnt);
    if (cnt < 1) {
      // Bail out as there is an activation signal from an inactive participant
      var error = new Error('Trying to inactivate an inactive participant (' + idFrom.actor + ')');
      error.hash = {
        text: '->>-',
        token: '->>-',
        line: '1',
        loc: { first_line: 1, last_line: 1, first_column: 1, last_column: 1 },
        expected: ["'ACTIVE_PARTICIPANT'"]
      };
      throw error;
    }
  }
  messages.push({ from: idFrom, to: idTo, message: message, type: messageType });
  return true;
};

export const getMessages = function() {
  return messages;
};

export const getActors = function() {
  return actors;
};
export const getActor = function(id) {
  return actors[id];
};
export const getActorKeys = function() {
  return Object.keys(actors);
};
export const getTitle = function() {
  return title;
};
export const enableSequenceNumbers = function() {
  sequenceNumbersEnabled = true;
};
export const showSequenceNumbers = () => sequenceNumbersEnabled;

export const clear = function() {
  actors = {};
  messages = [];
};

export const LINETYPE = {
  SOLID: 0,
  DOTTED: 1,
  NOTE: 2,
  SOLID_CROSS: 3,
  DOTTED_CROSS: 4,
  SOLID_OPEN: 5,
  DOTTED_OPEN: 6,
  LOOP_START: 10,
  LOOP_END: 11,
  ALT_START: 12,
  ALT_ELSE: 13,
  ALT_END: 14,
  OPT_START: 15,
  OPT_END: 16,
  ACTIVE_START: 17,
  ACTIVE_END: 18,
  PAR_START: 19,
  PAR_AND: 20,
  PAR_END: 21,
  RECT_START: 22,
  RECT_END: 23
};

export const ARROWTYPE = {
  FILLED: 0,
  OPEN: 1
};

export const PLACEMENT = {
  LEFTOF: 0,
  RIGHTOF: 1,
  OVER: 2
};

export const addNote = function(actor, placement, message) {
  const note = { actor: actor, placement: placement, message: message };

  // Coerce actor into a [to, from, ...] array
  const actors = [].concat(actor, actor);

  notes.push(note);
  messages.push({
    from: actors[0],
    to: actors[1],
    message: message,
    type: LINETYPE.NOTE,
    placement: placement
  });
};

export const setTitle = function(titleText) {
  title = titleText;
};

export const apply = function(param) {
  if (param instanceof Array) {
    param.forEach(function(item) {
      apply(item);
    });
  } else {
    switch (param.type) {
      case 'addActor':
        addActor(param.actor, param.actor, param.description);
        break;
      case 'activeStart':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;
      case 'activeEnd':
        addSignal(param.actor, undefined, undefined, param.signalType);
        break;
      case 'addNote':
        addNote(param.actor, param.placement, param.text);
        break;
      case 'addMessage':
        addSignal(param.from, param.to, param.msg, param.signalType);
        break;
      case 'loopStart':
        addSignal(undefined, undefined, param.loopText, param.signalType);
        break;
      case 'loopEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'rectStart':
        addSignal(undefined, undefined, param.color, param.signalType);
        break;
      case 'rectEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'optStart':
        addSignal(undefined, undefined, param.optText, param.signalType);
        break;
      case 'optEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'altStart':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;
      case 'else':
        addSignal(undefined, undefined, param.altText, param.signalType);
        break;
      case 'altEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
      case 'setTitle':
        setTitle(param.text);
        break;
      case 'parStart':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;
      case 'and':
        addSignal(undefined, undefined, param.parText, param.signalType);
        break;
      case 'parEnd':
        addSignal(undefined, undefined, undefined, param.signalType);
        break;
    }
  }
};

export default {
  addActor,
  addMessage,
  addSignal,
  enableSequenceNumbers,
  showSequenceNumbers,
  getMessages,
  getActors,
  getActor,
  getActorKeys,
  getTitle,
  clear,
  LINETYPE,
  ARROWTYPE,
  PLACEMENT,
  addNote,
  setTitle,
  apply
};
