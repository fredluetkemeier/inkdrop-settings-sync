'use babel';

import InkdropSettingsSyncMessageDialog from './inkdrop-settings-sync-message-dialog';

module.exports = {

  activate() {
    inkdrop.components.registerClass(InkdropSettingsSyncMessageDialog);
    inkdrop.layouts.addComponentToLayout(
      'modal',
      'InkdropSettingsSyncMessageDialog'
    )
  },

  deactivate() {
    inkdrop.layouts.removeComponentFromLayout(
      'modal',
      'InkdropSettingsSyncMessageDialog'
    )
    inkdrop.components.deleteClass(InkdropSettingsSyncMessageDialog);
  }

};
