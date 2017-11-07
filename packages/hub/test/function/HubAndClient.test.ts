import {expect} from 'chai';
import {Hub} from '../../src/hub/Hub';
import {HubClient} from '../../src/hub/HubClient';
import {Selector} from '../../src/domain';
describe('HubAndClient', () => {

  class TestHub extends Hub {
    getRouteTable () {
      return this.routeTable;
    }
  }

  let hub: TestHub;
  let clientA: HubClient;
  let clientB: HubClient;

  before(async () => {
    hub = new TestHub;
    clientA = new HubClient({
      location: {
        appName: 'testApp',
        processName: 'process1',
        pid: '1'
      }
    });
    clientB = new HubClient({
      location: {
        appName: 'testApp',
        processName: 'process2',
        pid: '2'
      }
    });
    await hub.start();
    await clientA.start();
    await clientB.start();
  });
  after(async () => {
    await clientB.stop();
    await clientA.stop();
    await hub.stop();
  });

  it('should publish selector to Hub be ok', async () => {
    const location = clientA.getLocation();
    const selector: Selector = {
      ...location,
      objectName: 'object1'
    };
    const publishRes = await clientA.publish(selector);
    expect(publishRes.success).to.be.equal(true);
    const routeTable = hub.getRouteTable();

    const allClients = routeTable.getAllClients();
    expect(allClients.length).to.be.equal(2);
    const client = routeTable.selectClients(location)[0].client;
    const selectors = routeTable.getSelectorsByClient(client);
    expect(selectors.length).to.be.equal(3);
    expect(selectors[2].objectName).to.be.equal('object1');
  });

  it('should invoke be ok', async () => {
    const location = clientA.getLocation();
    const selector: Selector = {
      ...location,
      objectName: 'object1'
    };

    const res = await clientB.invoke(selector, 'myAction', {
      action: 'echo',
      data: {
        testData: '1234'
      }
    });
    expect(res.data.echo.data.testData).to.be.equal('1234');
  });

  it('should unpublish selector to Hub be ok', async () => {
    const location = clientA.getLocation();
    const selector: Selector = {
      ...location,
      objectName: 'object1'
    };
    const unpublishRes = await clientA.unpublish(selector);
    expect(unpublishRes.success).to.be.equal(true);

    const routeTable = hub.getRouteTable();
    const client = routeTable.selectClients(location)[0].client;
    const selectors = routeTable.getSelectorsByClient(client);
    expect(selectors.length).to.be.equal(2);

    const clients = routeTable.selectClients({
      objectName: 'object1'
    });

    expect(clients.length).to.be.equal(0);

  });

});