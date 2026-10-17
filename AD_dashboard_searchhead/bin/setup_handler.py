import splunk.admin as admin
import splunk.rest as rest

APP_NAME = 'AD_dashboard_searchhead'
MACRO_NAME = 'DC-index'


class SetupHandler(admin.MConfigHandler):

    def setup(self):
        # Advertise the arguments we accept for EDIT and CREATE
        if self.requestedAction in (admin.ACTION_EDIT, admin.ACTION_CREATE):
            self.supportedArgs.addOptArg('definition')

    def _write_definition(self, definition):
        stanza_url = '/servicesNS/nobody/%s/configs/conf-macros/%s' % (APP_NAME, MACRO_NAME)
        rest.simpleRequest(
            stanza_url,
            sessionKey=self.getSessionKey(),
            method='POST',
            postargs={'definition': definition},
        )
        reload_url = '/servicesNS/nobody/%s/configs/conf-macros/_reload' % APP_NAME
        rest.simpleRequest(
            reload_url,
            sessionKey=self.getSessionKey(),
            method='POST',
        )

    def handleEdit(self, confInfo):
        definition = self.callerArgs.data['definition'][0]
        self._write_definition(definition)
        confInfo['DC-index']['definition'] = definition

    def handleCreate(self, confInfo):
        # Same behavior as edit — the POST body carries the definition.
        definition = self.callerArgs.data['definition'][0]
        self._write_definition(definition)
        confInfo['DC-index']['definition'] = definition

    def handleList(self, confInfo):
        # Required so the framework can enumerate the endpoint when queried.
        confInfo['DC-index'].append('definition', self.callerArgs.data.get('definition', [''])[0])


admin.init(SetupHandler, admin.CONTEXT_APP_AND_USER)