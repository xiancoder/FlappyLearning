/**
 * 提供一组 处理神经进化和遗传 的算法
 *
 * @param {options} 神经进化选项的对象
 */
var Neuroevolution = function (options) {
    var self = this; // 引用此模块的顶部作用域
    // 模块参数（选项）和默认值的声明
    self.options = {
        /**
         * 逻辑激活功能
         *
         * @param {a} 输入值
         * @return 逻辑功能输出
         */
        activation: function (a) {
            ap = (-a) / 1;
            return (1 / (1 + Math.exp(ap)))
        },
        /**
         * 返回介于-1和1之间的随机值
         *
         * @return 随机值
         */
        randomClamped: function () {
            return Math.random() * 2 - 1;
        },
        // 各种因素和参数（以及默认值）
        network: [1, [1], 1], // 感知器网络结构（1隐藏 / 层）
        population: 50, // 学习世代
        elitism: 0.2, // 最佳网络kepts不变 生成（速率）
        randomBehaviour: 0.2, // 新一代随机网络（速率）
        mutationRate: 0.1, // 突触重量突变率
        mutationRange: 0.5, // 突变间隔 突触权重
        historic: 0, // 保存了最新一代
        lowHistoric: false, // 只保存分数（不保存网络）
        scoreSort: -1, // 排序顺序（-1=desc，1=asc）
        nbChild: 1 // 通过繁殖的儿童数量
    }
    /**
     * 覆盖默认选项
     *
     * @param {options} 神经进化选项的对象
     * @return void
     */
    self.set = function (options) {
        for (var i in options) {
            if (this.options[i] != undefined) { // 仅当传入值
                // 是实际定义的
                self.options[i] = options[i];
            }
        }
    }
    // 用传入选项覆盖默认选项
    self.set(options);
    /* 神经元 英文 Neuron **********************************************************************/
    /**
     * 人工神经元类
     *
     * @constructor
     */
    var Neuron = function () {
        this.value = 0;
        this.weights = [];
    }
    /**
     * 将神经元权重数初始化为随机钳制值
     *
     * @param {nb} 神经元重量数（输入数）
     * @return void
     */
    Neuron.prototype.populate = function (nb) {
        this.weights = [];
        for (var i = 0; i < nb; i++) {
            this.weights.push(self.options.randomClamped());
        }
    }
    /* 层 英文 layer ***********************************************************************/
    /**
     * 神经网络层类
     *
     * @constructor
     * @param {index} 网络中该层的索引.
     */
    var Layer = function (index) {
        this.id = index || 0;
        this.neurons = [];
    }
    /**
     * 用一组随机加权的神经元填充层
     *
     * 每一个神经元都是用随机钳位的nbinputs输入初始化的值
     *
     * @param {nbNeurons} 神经细胞数量
     * @param {nbInputs} 输入数量
     * @return void
     */
    Layer.prototype.populate = function (nbNeurons, nbInputs) {
        this.neurons = [];
        for (var i = 0; i < nbNeurons; i++) {
            var n = new Neuron();
            n.populate(nbInputs);
            this.neurons.push(n);
        }
    }
    /* 神经网络 英文 neural network **************************************************************/
    /**
     * 神经网络类
     *
     * 由神经元层组成
     *
     * @constructor
     */
    var Network = function () {
        this.layers = [];
    }
    /**
     * 生成网络层
     *
     * @param {input} 入层神经元数量
     * @param {hidden} 每个隐藏层的神经元数量
     * @param {output} 输出层神经元数量
     * @return void
     */
    Network.prototype.perceptronGeneration = function (input, hiddens, output) {
        var index = 0;
        var previousNeurons = 0;
        var layer = new Layer(index);
        layer.populate(input, previousNeurons); //输入数量等于
        // 0 since it is an input layer.
        previousNeurons = input; // number of input is size of previous layer.
        this.layers.push(layer);
        index++;
        for (var i in hiddens) {
            // Repeat same process as first layer for each hidden layer.
            var layer = new Layer(index);
            layer.populate(hiddens[i], previousNeurons);
            previousNeurons = hiddens[i];
            this.layers.push(layer);
            index++;
        }
        var layer = new Layer(index);
        layer.populate(output, previousNeurons); // 输入数量等于
        // 上次隐藏的大小
        // 层
        this.layers.push(layer);
    }
    /**
     * 创建网络的副本（神经元和权重）
     *
     * 返回每层的神经元数和所有权重的平面数组
     *
     * @return 网络数据
     */
    Network.prototype.getSave = function () {
        var datas = {
            neurons: [], // 每层的神经元数量
            weights: [] // 每个神经元输入的权重
        };
        for (var i in this.layers) {
            datas.neurons.push(this.layers[i].neurons.length);
            for (var j in this.layers[i].neurons) {
                for (var k in this.layers[i].neurons[j].weights) {
                    // 将每层神经元的所有输入权重推到一个平面上
                    // 数组
                    datas.weights.push(this.layers[i].neurons[j].weights[k]);
                }
            }
        }
        return datas;
    }
    /**
     * 应用网络数据（神经元和权重）
     *
     * @param {save} 网络数据的副本（神经元和权重）
     * @return void
     */
    Network.prototype.setSave = function (save) {
        var previousNeurons = 0;
        var index = 0;
        var indexWeights = 0;
        this.layers = [];
        for (var i in save.neurons) {
            // 创建和填充层
            var layer = new Layer(index);
            layer.populate(save.neurons[i], previousNeurons);
            for (var j in layer.neurons) {
                for (var k in layer.neurons[j].weights) {
                    // 对每个神经元应用神经元权重
                    layer.neurons[j].weights[k] = save.weights[indexWeights];
                    indexWeights++; // 平面数组的增量索引
                }
            }
            previousNeurons = save.neurons[i];
            index++;
            this.layers.push(layer);
        }
    }
    /**
     * 计算输入的输出
     *
     * @param {inputs} 输入集
     * @return 网络输出
     */
    Network.prototype.compute = function (inputs) {
        // 设置输入层中每个神经元的值
        for (var i in inputs) {
            if (this.layers[0] && this.layers[0].neurons[i]) {
                this.layers[0].neurons[i].value = inputs[i];
            }
        }
        var prevLayer = this.layers[0]; // 上一层是输入层
        for (var i = 1; i < this.layers.length; i++) {
            for (var j in this.layers[i].neurons) {
                // 对于每层中的每个神经元
                var sum = 0;
                for (var k in prevLayer.neurons) {
                    // 前一层中的每个神经元都是中每个神经元的输入
                    // 下一层
                    sum += prevLayer.neurons[k].value *
                        this.layers[i].neurons[j].weights[k];
                }
                // 计算神经元的激活
                this.layers[i].neurons[j].value = self.options.activation(sum);
            }
            prevLayer = this.layers[i];
        }
        // 网络的所有输出
        var out = [];
        var lastLayer = this.layers[this.layers.length - 1];
        for (var i in lastLayer.neurons) {
            out.push(lastLayer.neurons[i].value);
        }
        return out;
    }
    /* 基因组 genome **********************************************************************/
    /**
     * 基因组分类
     *
     * 由分数和神经网络组成
     *
     * @constructor
     *
     * @param {score} 得分
     * @param {network} 网络
     */
    var Genome = function (score, network) {
        this.score = score || 0;
        this.network = network || null;
    }
    /* 生成 generation ******************************************************************/
    /**
     * 生成类
     *
     * 由一组基因组组成
     *
     * @constructor
     */
    var Generation = function () {
        this.genomes = [];
    }
    /**
     * 为这一代人添加基因组
     *
     * @param {genome} 添加的基因组
     * @return void.
     */
    Generation.prototype.addGenome = function (genome) {
        // 定位插入基因组的位置
        // 地精应该保持排序
        for (var i = 0; i < this.genomes.length; i++) {
            // 按降序排序
            if (self.options.scoreSort < 0) {
                if (genome.score > this.genomes[i].score) {
                    break;
                }
                // 按升序排序
            } else {
                if (genome.score < this.genomes[i].score) {
                    break;
                }
            }
        }
        // 将基因组插入正确的位置
        this.genomes.splice(i, 0, genome);
    }
    /**
     * 繁殖到基因组产生后代
     *
     * @param {g1} 基因组1
     * @param {g2} 基因组2
     * @param {nbChilds} 子代数量（子代）
     */
    Generation.prototype.breed = function (g1, g2, nbChilds) {
        var datas = [];
        for (var nb = 0; nb < nbChilds; nb++) {
            // 基因组1的深克隆
            var data = JSON.parse(JSON.stringify(g1));
            for (var i in g2.network.weights) {
                // 遗传交叉
                // 0.5是交叉因子
                // fixme实际上应该是一个预定义的常量
                if (Math.random() <= 0.5) {
                    data.network.weights[i] = g2.network.weights[i];
                }
            }
            // 对某些权重执行突变
            for (var i in data.network.weights) {
                if (Math.random() <= self.options.mutationRate) {
                    data.network.weights[i] += Math.random() *
                        self.options.mutationRange *
                        2 -
                        self.options.mutationRange;
                }
            }
            datas.push(data);
        }
        return datas;
    }
    /**
     * 生成下一代
     *
     * @return 下一代数据数组
     */
    Generation.prototype.generateNextGeneration = function () {
        var nexts = [];
        for (var i = 0; i < Math.round(self.options.elitism *
                self.options.population); i++) {
            if (nexts.length < self.options.population) {
                // 对基因组网络进行深度复制
                nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
            }
        }
        for (var i = 0; i < Math.round(self.options.randomBehaviour *
                self.options.population); i++) {
            var n = JSON.parse(JSON.stringify(this.genomes[0].network));
            for (var k in n.weights) {
                n.weights[k] = self.options.randomClamped();
            }
            if (nexts.length < self.options.population) {
                nexts.push(n);
            }
        }
        var max = 0;
        while (true) {
            for (var i = 0; i < max; i++) {
                // 创建子级并将它们推送到nexts数组
                var childs = this.breed(this.genomes[i], this.genomes[max],
                    (self.options.nbChild > 0 ? self.options.nbChild : 1));
                for (var c in childs) {
                    nexts.push(childs[c].network);
                    if (nexts.length >= self.options.population) {
                        // 如果子级数等于
                        // 按generatino值填充
                        return nexts;
                    }
                }
            }
            max++;
            if (max >= this.genomes.length - 1) {
                max = 0;
            }
        }
    }
    /* 代 generations *****************************************************************/
    /**
     * 世代阶级
     *
     * 霍尔德的上一代和下一代
     *
     * @constructor
     */
    var Generations = function () {
        this.generations = [];
        var currentGeneration = new Generation();
    }
    /**
     * 创建第一代
     *
     * @param {input} 输入层
     * @param {input} 输入隐藏层
     * @param {output} 输出输出层
     * @return 第一代
     */
    Generations.prototype.firstGeneration = function (input, hiddens, output) {
        // fixme输入，hiddens，输出未使用
        var out = [];
        for (var i = 0; i < self.options.population; i++) {
            // 生成网络并保存
            var nn = new Network();
            nn.perceptronGeneration(self.options.network[0],
                self.options.network[1],
                self.options.network[2]);
            out.push(nn.getSave());
        }
        this.generations.push(new Generation());
        return out;
    }
    /**
     * 创建下一代
     *
     * @return 下一代
     */
    Generations.prototype.nextGeneration = function () {
        if (this.generations.length == 0) {
            // 需要创建第一代
            return false;
        }
        var gen = this.generations[this.generations.length - 1]
            .generateNextGeneration();
        this.generations.push(new Generation());
        return gen;
    }
    /**
     * 为后代添加一个基因组
     *
     * @param {genome} 基因组
     * @return 如果没有要添加到的代，则返回false
     */
    Generations.prototype.addGenome = function (genome) {
        // 如果没有代，则不能添加到代
        if (this.generations.length == 0) return false;
        // fixme addgenome返回void
        return this.generations[this.generations.length - 1].addGenome(genome);
    }
    /* 自我 self ************************************************************************/
    self.generations = new Generations();
    /**
     * 重置并创建新的Generations对象
     *
     * @return void.
     */
    self.restart = function () {
        self.generations = new Generations();
    }
    /**
     * 创建下一代
     *
     * @return 下一代的神经网络阵列
     */
    self.nextGeneration = function () {
        var networks = [];
        if (self.generations.generations.length == 0) {
            // 如果没有生成，请先创建
            networks = self.generations.firstGeneration();
        } else {
            // 否则，创建下一个
            networks = self.generations.nextGeneration();
        }
        // 从当前代创建网络
        var nns = [];
        for (var i in networks) {
            var nn = new Network();
            nn.setSave(networks[i]);
            nns.push(nn);
        }
        if (self.options.lowHistoric) {
            // 删除旧网络
            if (self.generations.generations.length >= 2) {
                var genomes =
                    self.generations
                    .generations[self.generations.generations.length - 2]
                    .genomes;
                for (var i in genomes) {
                    delete genomes[i].network;
                }
            }
        }
        if (self.options.historic != -1) {
            // 删除旧代
            if (self.generations.generations.length > self.options.historic + 1) {
                self.generations.generations.splice(0,
                    self.generations.generations.length - (self.options.historic + 1));
            }
        }
        return nns;
    }
    /**
     * 用指定的神经网络和分数添加新的基因组
     *
     * @param {network} 神经网络
     * @param {score} 得分值
     * @return void.
     */
    self.networkScore = function (network, score) {
        self.generations.addGenome(new Genome(score, network.getSave()));
    }
}
